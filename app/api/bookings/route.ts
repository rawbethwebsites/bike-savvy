import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const ACTIVE_BOOKING_STATUSES = ['held', 'pending_payment', 'confirmed', 'checked_in'];
const JOHANNESBURG_OFFSET = '+02:00';

type BookingInput = {
  customerId?: unknown;
  courseId?: unknown;
  instructorId?: unknown;
  date?: unknown;
  time?: unknown;
  notes?: unknown;
};

function errorResponse(message: string, status: number) {
  return NextResponse.json({ error: message }, { status });
}

function createSupabaseClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anonKey) throw new Error('Missing Supabase environment variables.');
  // This is intentionally instantiated inside the route: database access remains server-side.
  return createClient(url, anonKey);
}

function bookingNumber() {
  const date = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Africa/Johannesburg',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date()).replace(/\//g, '');

  return `BK-${date}-${crypto.randomUUID().replace(/-/g, '').slice(0, 12).toUpperCase()}`;
}

function parseJohannesburgDateTime(date: unknown, time: unknown) {
  if (typeof date !== 'string' || typeof time !== 'string') return null;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || !/^\d{2}:\d{2}$/.test(time)) return null;

  const value = new Date(`${date}T${time}:00${JOHANNESBURG_OFFSET}`);
  return Number.isNaN(value.getTime()) ? null : value;
}

export async function GET() {
  try {
    const supabase = createSupabaseClient();
    const [bookingsResult, customersResult, coursesResult, instructorsResult] = await Promise.all([
      supabase
        .from('bookings')
        .select('id, booking_number, customer_id, course_id, instructor_id, start_time, end_time, status, price_cents, payment_status, notes, location')
        .order('start_time', { ascending: false })
        .limit(250),
      supabase.from('customers').select('id, first_name, last_name, phone').order('last_name'),
      supabase
        .from('courses')
        .select('id, name, duration_minutes, price_cents, deposit_cents')
        .eq('is_active', true)
        .order('name'),
      supabase.from('instructors').select('id, user_id').eq('is_active', true),
    ]);

    const baseError = bookingsResult.error || customersResult.error || coursesResult.error || instructorsResult.error;
    if (baseError) throw baseError;

    const instructorUserIds = (instructorsResult.data ?? []).map((instructor) => instructor.user_id);
    const usersResult = instructorUserIds.length
      ? await supabase.from('dashboard_users').select('id, full_name').in('id', instructorUserIds)
      : { data: [], error: null };
    if (usersResult.error) throw usersResult.error;

    const customers = customersResult.data ?? [];
    const courses = coursesResult.data ?? [];
    const instructors = (instructorsResult.data ?? []).map((instructor) => ({
      id: instructor.id,
      full_name: usersResult.data?.find((user) => user.id === instructor.user_id)?.full_name ?? 'Unnamed instructor',
    }));
    const customerById = new Map(customers.map((customer) => [customer.id, customer]));
    const courseById = new Map(courses.map((course) => [course.id, course]));
    const instructorById = new Map(instructors.map((instructor) => [instructor.id, instructor]));

    const bookings = (bookingsResult.data ?? []).map((booking) => ({
      ...booking,
      customer: customerById.get(booking.customer_id) ?? null,
      course: courseById.get(booking.course_id) ?? null,
      instructor: booking.instructor_id ? instructorById.get(booking.instructor_id) ?? null : null,
    }));

    return NextResponse.json({ bookings, customers, courses, instructors });
  } catch (error) {
    console.error('Bookings API GET error:', error);
    return errorResponse('Failed to load bookings.', 500);
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as BookingInput;
    const customerId = typeof body.customerId === 'string' ? body.customerId : '';
    const courseId = typeof body.courseId === 'string' ? body.courseId : '';
    const instructorId = typeof body.instructorId === 'string' && body.instructorId ? body.instructorId : null;
    const notes = typeof body.notes === 'string' ? body.notes.trim().slice(0, 5000) : null;
    const startTime = parseJohannesburgDateTime(body.date, body.time);

    if (!customerId || !courseId || !startTime) {
      return errorResponse('Customer, course, date, and time are required.', 400);
    }

    const supabase = createSupabaseClient();
    const [customerResult, courseResult, ownerResult] = await Promise.all([
      supabase.from('customers').select('id').eq('id', customerId).maybeSingle(),
      supabase
        .from('courses')
        .select('id, duration_minutes, price_cents, deposit_cents')
        .eq('id', courseId)
        .eq('is_active', true)
        .maybeSingle(),
      supabase
        .from('dashboard_users')
        .select('id')
        .eq('role', 'owner')
        .eq('is_active', true)
        .order('created_at', { ascending: true })
        .limit(1)
        .maybeSingle(),
    ]);

    if (customerResult.error || courseResult.error || ownerResult.error) {
      throw customerResult.error || courseResult.error || ownerResult.error;
    }
    if (!customerResult.data) return errorResponse('The selected customer no longer exists.', 400);
    if (!courseResult.data) return errorResponse('Select an active course.', 400);
    if (!ownerResult.data) return errorResponse('No active owner is configured to create this booking.', 503);

    const endTime = new Date(startTime.getTime() + courseResult.data.duration_minutes * 60_000);
    if (instructorId) {
      const [instructorResult, conflictResult] = await Promise.all([
        supabase.from('instructors').select('id').eq('id', instructorId).eq('is_active', true).maybeSingle(),
        supabase
          .from('bookings')
          .select('booking_number, start_time, end_time')
          .eq('instructor_id', instructorId)
          .in('status', ACTIVE_BOOKING_STATUSES)
          .lt('start_time', endTime.toISOString())
          .gt('end_time', startTime.toISOString())
          .limit(1)
          .maybeSingle(),
      ]);

      if (instructorResult.error || conflictResult.error) throw instructorResult.error || conflictResult.error;
      if (!instructorResult.data) return errorResponse('The selected instructor is unavailable.', 400);
      if (conflictResult.data) {
        return errorResponse(`This instructor is already booked for an overlapping session (${conflictResult.data.booking_number}).`, 409);
      }
    }

    // The UUID suffix makes collisions exceptionally unlikely; retry handles a database uniqueness constraint if one exists.
    let createdBooking = null;
    let insertError: { code?: string; message: string } | null = null;
    for (let attempt = 0; attempt < 3; attempt += 1) {
      const result = await supabase
        .from('bookings')
        .insert({
          booking_number: bookingNumber(),
          customer_id: customerId,
          course_id: courseId,
          instructor_id: instructorId,
          start_time: startTime.toISOString(),
          end_time: endTime.toISOString(),
          status: 'held',
          price_cents: courseResult.data.price_cents,
          deposit_paid_cents: 0,
          payment_status: 'unpaid',
          source: 'dashboard',
          notes,
          created_by: ownerResult.data.id,
        })
        .select('id, booking_number')
        .single();
      if (!result.error) {
        createdBooking = result.data;
        break;
      }
      insertError = result.error;
      if (result.error.code !== '23505') break;
    }

    if (!createdBooking) throw insertError ?? new Error('Booking creation failed.');
    return NextResponse.json({ booking: createdBooking }, { status: 201 });
  } catch (error) {
    console.error('Bookings API POST error:', error);
    return errorResponse('Failed to create booking.', 500);
  }
}

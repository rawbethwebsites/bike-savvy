import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const ACTIVE_BOOKING_STATUSES = ['held', 'pending_payment', 'confirmed', 'checked_in'];
const JOHANNESBURG_OFFSET = '+02:00';

type PublicBookingInput = {
  firstName?: unknown;
  lastName?: unknown;
  phone?: unknown;
  email?: unknown;
  courseId?: unknown;
  date?: unknown;
  time?: unknown;
  ridingLevel?: unknown;
  hasOwnMotorcycle?: unknown;
  notes?: unknown;
  consent?: unknown;
  website?: unknown;
};

function jsonError(error: string, status: number) {
  return NextResponse.json({ error }, { status });
}

function supabaseClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) throw new Error('Missing Supabase environment variables.');
  return createClient(url, key, { auth: { persistSession: false } });
}

function clean(value: unknown, max = 200) {
  return typeof value === 'string' ? value.trim().slice(0, max) : '';
}

function parseCapeTownDateTime(date: string, time: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || !/^\d{2}:\d{2}$/.test(time)) return null;
  const value = new Date(`${date}T${time}:00${JOHANNESBURG_OFFSET}`);
  return Number.isNaN(value.getTime()) ? null : value;
}

function makeBookingNumber() {
  const day = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Africa/Johannesburg',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date()).replace(/\//g, '');
  return `WEB-${day}-${crypto.randomUUID().replace(/-/g, '').slice(0, 8).toUpperCase()}`;
}

export async function GET() {
  try {
    const { data, error } = await supabaseClient()
      .from('courses')
      .select('id, name, duration_minutes, price_cents, deposit_cents')
      .eq('is_active', true)
      .order('price_cents');

    if (error) {
      console.error('Public courses query failed:', { code: error.code, message: error.message, details: error.details });
      throw error;
    }
    return NextResponse.json({ courses: data ?? [] });
  } catch (error) {
    console.error('Public booking options error:', error);
    return jsonError('We could not load the available courses. Please try again.', 500);
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as PublicBookingInput;

    // Honeypot: bots fill hidden fields. Return a neutral response without touching the database.
    if (clean(body.website)) {
      return NextResponse.json({ reference: 'REQUEST-RECEIVED' }, { status: 201 });
    }

    const firstName = clean(body.firstName, 80);
    const lastName = clean(body.lastName, 80);
    const phone = clean(body.phone, 40).replace(/\s+/g, ' ');
    const email = clean(body.email, 160).toLowerCase();
    const courseId = clean(body.courseId, 80);
    const date = clean(body.date, 10);
    const time = clean(body.time, 5);
    const ridingLevel = clean(body.ridingLevel, 30) || 'beginner';
    const notes = clean(body.notes, 1000);
    const consent = body.consent === true;
    const hasOwnMotorcycle = body.hasOwnMotorcycle === true;
    const startTime = parseCapeTownDateTime(date, time);

    if (!firstName || !lastName || !phone || !courseId || !startTime) {
      return jsonError('Please complete your name, phone number, course, date, and time.', 400);
    }
    if (!/^[-+()\d\s]{7,40}$/.test(phone)) {
      return jsonError('Enter a valid phone number, including your area or country code.', 400);
    }
    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return jsonError('Enter a valid email address or leave it blank.', 400);
    }
    if (!consent) {
      return jsonError('Please allow Bike Savvy to contact you about this booking request.', 400);
    }

    const now = new Date();
    const latest = new Date(now.getTime() + 180 * 24 * 60 * 60 * 1000);
    if (startTime <= now) return jsonError('Choose a future date and time.', 400);
    if (startTime > latest) return jsonError('Bookings can be requested up to six months ahead.', 400);

    const hour = Number(time.slice(0, 2));
    if (hour < 7 || hour >= 18) {
      return jsonError('Choose a preferred start time between 07:00 and 17:30.', 400);
    }

    const supabase = supabaseClient();
    const [courseResult, ownerResult, customerLookup] = await Promise.all([
      supabase
        .from('courses')
        .select('id, name, duration_minutes, price_cents')
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
      supabase.from('customers').select('id').eq('phone', phone).limit(1).maybeSingle(),
    ]);

    if (courseResult.error || ownerResult.error || customerLookup.error) {
      throw courseResult.error || ownerResult.error || customerLookup.error;
    }
    if (!courseResult.data) return jsonError('That course is no longer available.', 400);
    if (!ownerResult.data) return jsonError('Online booking is temporarily unavailable.', 503);

    let customerId = customerLookup.data?.id;
    if (!customerId) {
      const customerResult = await supabase
        .from('customers')
        .insert({
          first_name: firstName,
          last_name: lastName,
          phone,
          email: email || null,
          riding_level: ridingLevel,
          has_own_motorcycle: hasOwnMotorcycle,
          communication_consent: true,
          communication_preference: 'whatsapp',
        })
        .select('id')
        .single();
      if (customerResult.error) throw customerResult.error;
      customerId = customerResult.data.id;
    }

    const endTime = new Date(startTime.getTime() + courseResult.data.duration_minutes * 60_000);
    const conflictResult = await supabase
      .from('bookings')
      .select('booking_number')
      .eq('customer_id', customerId)
      .in('status', ACTIVE_BOOKING_STATUSES)
      .lt('start_time', endTime.toISOString())
      .gt('end_time', startTime.toISOString())
      .limit(1)
      .maybeSingle();

    if (conflictResult.error) throw conflictResult.error;
    if (conflictResult.data) {
      return jsonError(`You already have a booking that overlaps this time (${conflictResult.data.booking_number}).`, 409);
    }

    const result = await supabase
      .from('bookings')
      .insert({
        booking_number: makeBookingNumber(),
        customer_id: customerId,
        course_id: courseId,
        instructor_id: null,
        status: 'draft',
        start_time: startTime.toISOString(),
        end_time: endTime.toISOString(),
        price_cents: courseResult.data.price_cents,
        deposit_paid_cents: 0,
        payment_status: 'unpaid',
        source: 'website',
        created_by: ownerResult.data.id,
        notes: [`Online booking request`, notes].filter(Boolean).join(': '),
      })
      .select('booking_number')
      .single();

    if (result.error) throw result.error;
    return NextResponse.json(
      {
        reference: result.data.booking_number,
        message: 'Your preferred session has been requested. Bike Savvy will contact you to confirm availability and payment.',
      },
      { status: 201 },
    );
  } catch (error) {
    console.error('Public booking request error:', error);
    return jsonError('We could not submit your request. Please try again in a moment.', 500);
  }
}

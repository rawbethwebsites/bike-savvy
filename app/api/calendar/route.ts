import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { getSupabaseReadCredentials } from '@/lib/calendar';

type RawCalendarBooking = {
  id: string;
  booking_number: string;
  start_time: string;
  end_time: string;
  status: string;
  location: string | null;
  customer: { first_name: string; last_name: string };
  course: { name: string };
  instructor: {
    id: string;
    user: { full_name: string } | null;
  } | null;
};

type RawInstructor = {
  id: string;
  user: { full_name: string } | null;
};

const ACTIVE_CALENDAR_STATUSES = [
  'confirmed',
  'checked_in',
  'held',
  'pending_payment',
];

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const startParam = searchParams.get('start');
    const endParam = searchParams.get('end');

    if (!startParam || !endParam) {
      return NextResponse.json(
        { error: 'Missing start or end parameter' },
        { status: 400 },
      );
    }

    const startDate = new Date(startParam);
    const endDate = new Date(endParam);

    if (
      Number.isNaN(startDate.getTime()) ||
      Number.isNaN(endDate.getTime()) ||
      startDate > endDate
    ) {
      return NextResponse.json(
        { error: 'Invalid date parameters' },
        { status: 400 },
      );
    }

    const maximumRangeMs = 62 * 24 * 60 * 60 * 1000;
    if (endDate.getTime() - startDate.getTime() > maximumRangeMs) {
      return NextResponse.json(
        { error: 'Calendar range cannot exceed 62 days' },
        { status: 400 },
      );
    }

    const { url, key } = getSupabaseReadCredentials(process.env);
    const supabase = createClient(url, key, {
      auth: { persistSession: false, autoRefreshToken: false },
    });

    const [bookingsResult, instructorsResult] = await Promise.all([
      supabase
        .from('bookings')
        .select(`
          id,
          booking_number,
          start_time,
          end_time,
          status,
          location,
          customer:customers(first_name, last_name),
          course:courses(name),
          instructor:instructors(id, user:dashboard_users(full_name))
        `)
        .gte('start_time', startDate.toISOString())
        .lte('end_time', endDate.toISOString())
        .in('status', ACTIVE_CALENDAR_STATUSES)
        .order('start_time', { ascending: true }),
      supabase
        .from('instructors')
        .select('id, user:dashboard_users(full_name)')
        .eq('is_active', true),
    ]);

    if (bookingsResult.error) throw bookingsResult.error;
    if (instructorsResult.error) throw instructorsResult.error;

    const bookings = ((bookingsResult.data ?? []) as unknown as RawCalendarBooking[]).map((booking) => ({
      ...booking,
      instructor: booking.instructor
        ? {
            id: booking.instructor.id,
            full_name: booking.instructor.user?.full_name || 'Unnamed instructor',
          }
        : null,
    }));

    const instructors = ((instructorsResult.data ?? []) as unknown as RawInstructor[]).map(
      (instructor) => ({
        id: instructor.id,
        full_name: instructor.user?.full_name || 'Unnamed instructor',
      }),
    );

    return NextResponse.json(
      { data: bookings, instructors },
      { headers: { 'Cache-Control': 'no-store' } },
    );
  } catch (error: unknown) {
    console.error('Calendar API error:', error);
    const message = error instanceof Error ? error.message : String(error);
    return NextResponse.json(
      { error: `Calendar API error: ${message}` },
      { status: 500 },
    );
  }
}

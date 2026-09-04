import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function GET() {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseAnonKey) {
      throw new Error('Missing Supabase dashboard environment variables');
    }

    // Dashboard reads use the publishable key and the project's read-only RLS policies.
    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
    const now = new Date();
    const johannesburgDate = now.toLocaleDateString('en-CA', {
      timeZone: 'Africa/Johannesburg',
    });
    // South Africa has no daylight-saving time; +02:00 is stable year-round.
    const startOfDay = new Date(`${johannesburgDate}T00:00:00+02:00`);
    const endOfDay = new Date(`${johannesburgDate}T23:59:59.999+02:00`);

    // Get today's bookings with related data
    const { data: bookingsData, error: bookingsError } = await supabase
      .from('bookings')
      .select('*')
      .gte('start_time', startOfDay.toISOString())
      .lte('end_time', endOfDay.toISOString())
      .in('status', ['confirmed', 'pending_payment', 'checked_in'])
      .order('start_time', { ascending: true });

    if (bookingsError) throw bookingsError;

    const bookings = bookingsData as any[];

    if (!bookings || bookings.length === 0) {
      return NextResponse.json({
        bookingsToday: 0,
        instructorsWorking: 0,
        expectedRevenue: 0,
        pendingPayments: 0,
        bookingsThisWeek: 0,
        revenueThisWeek: 0,
        schedule: [],
        issues: []
      });
    }

    // Fetch related data for each booking
    const schedule = [];
    const issues = [];
    const instructorSet = new Set();
    let expectedRevenue = 0;
    let pendingPayments = 0;

    // Week calculations: Monday to Sunday
    const dayOfWeek = now.getUTCDay(); // 0 = Sunday, 1 = Monday, etc.
    const offsetToMonday = ((dayOfWeek + 6) % 7) * -1; // days to subtract to get Monday
    const monday = new Date(now);
    monday.setUTCDate(now.getUTCDate() + offsetToMonday);
    monday.setUTCHours(0, 0, 0, 0);
    const sunday = new Date(monday);
    sunday.setUTCDate(monday.getUTCDate() + 6);
    sunday.setUTCHours(23, 59, 59, 999);

    for (const booking of bookings) {
      // Get customer
      const { data: customer } = await supabase
        .from('customers')
        .select('first_name, last_name')
        .eq('id', booking.customer_id)
        .single() as { data: any };

      // Get course
      const { data: course } = await supabase
        .from('courses')
        .select('name')
        .eq('id', booking.course_id)
        .single() as { data: any };

      // Get instructor
      const { data: instructor } = await supabase
        .from('instructors')
        .select('user_id')
        .eq('id', booking.instructor_id)
        .single() as { data: any };

      // dashboard_users stores a full_name (not a first_name).
      let instructorName = 'Unassigned';
      if (instructor?.user_id) {
        const { data: user, error: userError } = await supabase
          .from('dashboard_users')
          .select('full_name')
          .eq('id', instructor.user_id)
          .single() as { data: any, error: any };

        if (userError) throw userError;
        instructorName = user?.full_name || 'Unassigned';
        instructorSet.add(instructor.user_id);
      }

      // Add to schedule
      schedule.push({
        id: booking.id,
        time: new Date(booking.start_time).toLocaleTimeString('en-ZA', {
          timeZone: 'Africa/Johannesburg',
          hour: '2-digit',
          minute: '2-digit',
          hour12: false,
        }),
        customer: customer ? `${customer.first_name} ${customer.last_name.charAt(0)}.` : 'Unknown',
        course: course?.name || 'Unknown Course',
        instructor: instructorName,
        status: booking.status
      });

      // Calculate revenue
      expectedRevenue += booking.price_cents || 0;

      // Check for pending payments
      if (booking.payment_status === 'unpaid' || booking.payment_status === 'pending') {
        pendingPayments++;
        issues.push({
          id: booking.id,
          type: 'payment',
          message: customer ? `${customer.first_name} ${customer.last_name} - payment ${booking.payment_status.replace('_', ' ')}` : 'Payment pending',
          severity: 'medium' as const
        });
      }
    }

    // Weekly stats: fetch bookings for the week (Monday-Sunday) with status confirmed/pending_payment/checked_in
    const { data: weekBookingsData, error: weekError } = await supabase
      .from('bookings')
      .select('price_cents')
      .gte('start_time', monday.toISOString())
      .lte('end_time', sunday.toISOString())
      .in('status', ['confirmed', 'pending_payment', 'checked_in']);

    const weekBookings = weekBookingsData as any[];

    let bookingsThisWeek = 0;
    let revenueThisWeek = 0;
    if (!weekError && weekBookings) {
      bookingsThisWeek = weekBookings.length;
      revenueThisWeek = weekBookings.reduce((sum, b) => sum + (b.price_cents || 0), 0);
    }

    // Sort schedule by time
    schedule.sort((a, b) => a.time.localeCompare(b.time));

    return NextResponse.json({
      bookingsToday: bookings.length,
      instructorsWorking: instructorSet.size,
      expectedRevenue: Math.floor(expectedRevenue / 100),
      pendingPayments,
      bookingsThisWeek,
      revenueThisWeek: Math.floor(revenueThisWeek / 100),
      schedule,
      issues
    });
  } catch (error: any) {
    console.error('Dashboard API error:', error);
    const message = error?.message ?? String(error);
    return NextResponse.json(
      { error: `Dashboard API error: ${message}` },
      { status: 500 }
    );
  }
}
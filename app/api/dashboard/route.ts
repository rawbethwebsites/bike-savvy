import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function GET() {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    
    if (!supabaseUrl || !supabaseServiceKey) {
      return NextResponse.json(
        { error: 'Missing Supabase credentials' },
        { status: 500 }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    const now = new Date();
    const startOfDay = new Date(now.setHours(0, 0, 0, 0));
    const endOfDay = new Date(now.setHours(23, 59, 59, 999));

    // Get today's bookings with related data
    const { data: bookings, error: bookingsError } = await supabase
      .from('bookings')
      .select('*')
      .gte('start_time', startOfDay.toISOString())
      .lte('end_time', endOfDay.toISOString())
      .in('status', ['confirmed', 'pending_payment', 'checked_in']);

    if (bookingsError) throw bookingsError;

    if (!bookings || bookings.length === 0) {
      return NextResponse.json({
        bookingsToday: 0,
        instructorsWorking: 0,
        expectedRevenue: 0,
        pendingPayments: 0,
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

    for (const booking of bookings) {
      // Get customer
      const { data: customer } = await supabase
        .from('customers')
        .select('first_name, last_name')
        .eq('id', booking.customer_id)
        .single();

      // Get course
      const { data: course } = await supabase
        .from('courses')
        .select('name')
        .eq('id', booking.course_id)
        .single();

      // Get instructor
      const { data: instructor } = await supabase
        .from('instructors')
        .select('user_id')
        .eq('id', booking.instructor_id)
        .single();

      // Get instructor name
      let instructorName = 'Unknown';
      if (instructor?.user_id) {
        const { data: user } = await supabase
          .from('dashboard_users')
          .select('first_name')
          .eq('id', instructor.user_id)
          .single();
        instructorName = user?.first_name || 'Unknown';
        instructorSet.add(instructor.user_id);
      }

      // Add to schedule
      schedule.push({
        id: booking.id,
        time: new Date(booking.start_time).toLocaleTimeString('en-ZA', { 
          hour: '2-digit', 
          minute: '2-digit' 
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

    // Sort schedule by time
    schedule.sort((a, b) => a.time.localeCompare(b.time));

    return NextResponse.json({
      bookingsToday: bookings.length,
      instructorsWorking: instructorSet.size,
      expectedRevenue: Math.floor(expectedRevenue / 100),
      pendingPayments,
      schedule,
      issues
    });
  } catch (error) {
    console.error('Dashboard API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch dashboard data' },
      { status: 500 }
    );
  }
}

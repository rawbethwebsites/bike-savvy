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
      .select(`
        id,
        booking_number,
        status,
        start_time,
        end_time,
        price_cents,
        deposit_paid_cents,
        payment_status,
        customers!inner(first_name, last_name),
        courses!inner(name),
        instructors!inner(user_id),
        dashboard_users(first_name, last_name)
      `)
      .gte('start_time', startOfDay.toISOString())
      .lte('end_time', endOfDay.toISOString())
      .in('status', ['confirmed', 'pending_payment', 'checked_in']);

    if (bookingsError) throw bookingsError;

    // Get unique instructors working today
    const instructorIds = [...new Set(bookings?.map(b => b.instructors.user_id) || [])];
    const instructorsWorking = instructorIds.length;

    // Calculate KPIs
    const bookingsToday = bookings?.length || 0;
    const expectedRevenue = bookings?.reduce((sum, b) => sum + (b.price_cents || 0), 0) || 0;
    const pendingPayments = bookings?.filter(b => 
      b.payment_status === 'unpaid' || b.payment_status === 'pending'
    ).length || 0;

    // Format schedule
    const schedule = bookings?.map(b => ({
      id: b.id,
      time: new Date(b.start_time).toLocaleTimeString('en-ZA', { 
        hour: '2-digit', 
        minute: '2-digit' 
      }),
      customer: `${b.customers.first_name} ${b.customers.last_name.charAt(0)}.`,
      course: b.courses.name,
      instructor: b.dashboard_users.first_name,
      status: b.status
    })) || [];

    // Sort by time
    schedule.sort((a, b) => a.time.localeCompare(b.time));

    // Get issues (pending payments)
    const issues = bookings
      ?.filter(b => b.payment_status === 'unpaid' || b.payment_status === 'pending')
      .map(b => ({
        id: b.id,
        type: 'payment',
        message: `${b.customers.first_name} ${b.customers.last_name} - payment ${b.payment_status.replace('_', ' ')}`,
        severity: 'medium' as const
      })) || [];

    return NextResponse.json({
      bookingsToday,
      instructorsWorking,
      expectedRevenue: Math.floor(expectedRevenue / 100), // Convert cents to Rands
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

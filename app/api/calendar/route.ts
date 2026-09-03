import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const startParam = searchParams.get('start');
    const endParam = searchParams.get('end');
    if (!startParam || !endParam) {
      return NextResponse.json({ error: 'Missing start or end parameter' }, { status: 400 });
    }
    const startDate = new Date(startParam);
    const endDate = new Date(endParam);
    if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
      return NextResponse.json({ error: 'Invalid date parameters' }, { status: 400 });
    }
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!supabaseUrl || !supabaseServiceRoleKey) {
      return NextResponse.json({ error: 'Missing Supabase credentials' }, { status: 500 });
    }
    const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);
    const { data, error } = await supabase
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
        instructor:dashboard_users(full_name)
      `)
      .gte('start_time', startDate.toISOString())
      .lte('end_time', endDate.toISOString())
      .in('status', ['confirmed', 'checked_in', 'held', 'pending_payment'])
      .order('start_time', { ascending: true });
    if (error) throw error;
    return NextResponse.json({ data: data ?? [] });
  } catch (error) {
    console.error('Calendar API error:', error);
    return NextResponse.json({ error: 'Failed to fetch calendar data' }, { status: 500 });
  }
}

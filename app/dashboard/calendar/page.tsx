'use client';

export const dynamic = 'force-dynamic';
export const revalidate = 0;



import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';

type CalendarView = 'day' | 'week' | 'month';
type ViewMode = 'instructor' | 'resource';

interface Booking {
  id: string;
  booking_number: string;
  customer: { first_name: string; last_name: string };
  course: { name: string };
  instructor: { full_name: string } | null;
  start_time: string;
  end_time: string;
  status: string;
  location: string | null;
}

interface Instructor {
  id: string;
  full_name: string;
}

export default function CalendarPage() {
  const [view, setView] = useState<CalendarView>('week');
  const [viewMode, setViewMode] = useState<ViewMode>('instructor');
  const [currentDate, setCurrentDate] = useState(new Date());
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [instructors, setInstructors] = useState<Instructor[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);

  const supabase = createClient();

  // Load bookings and instructors
  useEffect(() => {
    loadData();
  }, [currentDate, view]);

  async function loadData() {
    setLoading(true);
    setError(null);
    
    try {
      // Calculate date range based on view
      const startDate = getStartDate(currentDate, view);
      const endDate = getEndDate(currentDate, view);

      // Fetch bookings
      const { data: bookingsData, error: bookingsError } = await supabase
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

      if (bookingsError) throw bookingsError;

      // Fetch instructors
      const { data: instructorsData, error: instructorsError } = await supabase
        .from('instructors')
        .select(`
          id,
          full_name:dashboard_users(full_name)
        `)
        .eq('is_active', true);

      if (instructorsError) throw instructorsError;

      if (bookingsData) setBookings(bookingsData as unknown as Booking[]);
      if (instructorsData) setInstructors(instructorsData as unknown as Instructor[]);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load calendar data');
      console.error('Calendar load error:', err);
    } finally {
      setLoading(false);
    }
  }

  function getStartDate(date: Date, view: CalendarView) {
    const d = new Date(date);
    if (view === 'day') {
      d.setHours(0, 0, 0, 0);
      return d;
    }
    if (view === 'week') {
      const day = d.getDay();
      const diff = d.getDate() - day + (day === 0 ? -6 : 1); // Adjust to Monday
      d.setDate(diff);
      d.setHours(0, 0, 0, 0);
      return d;
    }
    // Month
    d.setDate(1);
    d.setHours(0, 0, 0, 0);
    return d;
  }

  function getEndDate(date: Date, view: CalendarView) {
    const d = new Date(date);
    if (view === 'day') {
      d.setHours(23, 59, 59, 999);
      return d;
    }
    if (view === 'week') {
      const day = d.getDay();
      const diff = d.getDate() + (day === 0 ? 0 : 7) - day; // Adjust to Sunday
      d.setDate(diff);
      d.setHours(23, 59, 59, 999);
      return d;
    }
    // Month
    d.setMonth(d.getMonth() + 1);
    d.setDate(0);
    d.setHours(23, 59, 59, 999);
    return d;
  }

  function navigate(direction: 'prev' | 'next') {
    const newDate = new Date(currentDate);
    if (view === 'day') {
      newDate.setDate(newDate.getDate() + (direction === 'next' ? 1 : -1));
    } else if (view === 'week') {
      newDate.setDate(newDate.getDate() + (direction === 'next' ? 7 : -7));
    } else {
      newDate.setMonth(newDate.getMonth() + (direction === 'next' ? 1 : -1));
    }
    setCurrentDate(newDate);
  }

  function getStatusColor(status: string) {
    switch (status) {
      case 'confirmed': return 'bg-blue-100 border-blue-300 text-blue-900';
      case 'checked_in': return 'bg-green-100 border-green-300 text-green-900';
      case 'held': return 'bg-yellow-100 border-yellow-300 text-yellow-900';
      case 'pending_payment': return 'bg-orange-100 border-orange-300 text-orange-900';
      default: return 'bg-gray-100 border-gray-300 text-gray-900';
    }
  }

  function formatTime(dateString: string) {
    return new Date(dateString).toLocaleTimeString('en-ZA', { 
      hour: '2-digit', 
      minute: '2-digit',
      hour12: true 
    });
  }

  function formatDate(date: Date) {
    return date.toLocaleDateString('en-ZA', { 
      weekday: 'short', 
      day: 'numeric', 
      month: 'short',
      year: 'numeric'
    });
  }

  function getBookingsForInstructor(instructorId: string, date: Date) {
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);

    return bookings.filter(booking => {
      const bookingStart = new Date(booking.start_time);
      // Simple instructor matching - in real app would need proper join
      return bookingStart >= startOfDay && bookingStart <= endOfDay;
    });
  }

  function getDatesInRange() {
    const dates = [];
    const start = getStartDate(currentDate, view);
    const end = getEndDate(currentDate, view);
    const current = new Date(start);
    
    while (current <= end) {
      dates.push(new Date(current));
      current.setDate(current.getDate() + 1);
    }
    return dates;
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Calendar</h1>
            <p className="text-gray-600 mt-1">View and manage bookings across instructors</p>
          </div>
          <button className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700">
            + New Booking
          </button>
        </div>

        {/* Controls */}
        <div className="flex items-center gap-4 mb-6 bg-white p-4 rounded-lg shadow">
          <div className="flex items-center gap-2">
            <button
              onClick={() => navigate('prev')}
              className="p-2 hover:bg-gray-100 rounded"
            >
              ←
            </button>
            <span className="font-medium min-w-[200px] text-center">
              {formatDate(getStartDate(currentDate, view))} - {formatDate(getEndDate(currentDate, view))}
            </span>
            <button
              onClick={() => navigate('next')}
              className="p-2 hover:bg-gray-100 rounded"
            >
              →
            </button>
          </div>

          <div className="flex items-center gap-2 border-l pl-4">
            <button
              onClick={() => setView('day')}
              className={`px-3 py-1 rounded ${view === 'day' ? 'bg-blue-100 text-blue-700' : 'hover:bg-gray-100'}`}
            >
              Day
            </button>
            <button
              onClick={() => setView('week')}
              className={`px-3 py-1 rounded ${view === 'week' ? 'bg-blue-100 text-blue-700' : 'hover:bg-gray-100'}`}
            >
              Week
            </button>
            <button
              onClick={() => setView('month')}
              className={`px-3 py-1 rounded ${view === 'month' ? 'bg-blue-100 text-blue-700' : 'hover:bg-gray-100'}`}
            >
              Month
            </button>
          </div>

          <div className="flex items-center gap-2 border-l pl-4">
            <span className="text-sm text-gray-600">View by:</span>
            <button
              onClick={() => setViewMode('instructor')}
              className={`px-3 py-1 rounded ${viewMode === 'instructor' ? 'bg-blue-100 text-blue-700' : 'hover:bg-gray-100'}`}
            >
              Instructor
            </button>
            <button
              onClick={() => setViewMode('resource')}
              className={`px-3 py-1 rounded ${viewMode === 'resource' ? 'bg-blue-100 text-blue-700' : 'hover:bg-gray-100'}`}
            >
              Resource
            </button>
          </div>

          <div className="ml-auto">
            <button
              onClick={() => setCurrentDate(new Date())}
              className="text-sm text-blue-600 hover:underline"
            >
              Today
            </button>
          </div>
        </div>

        {/* Calendar Grid */}
        {error ? (
          <div className="bg-white rounded-lg shadow p-12 text-center">
            <p className="text-red-600 font-medium mb-4">Failed to load calendar</p>
            <p className="text-gray-600 text-sm mb-4">{error}</p>
            <button
              onClick={() => loadData()}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
            >
              Retry
            </button>
          </div>
        ) : loading ? (
          <div className="bg-white rounded-lg shadow p-12 text-center">
            <p className="text-gray-500">Loading calendar...</p>
          </div>
        ) : viewMode === 'instructor' ? (
          <div className="bg-white rounded-lg shadow overflow-hidden">
            {/* Header Row */}
            <div className="grid grid-cols-[200px_1fr] border-b">
              <div className="p-4 border-r bg-gray-50 font-medium text-gray-700">
                Instructor
              </div>
              <div className="grid" style={{ gridTemplateColumns: `repeat(${getDatesInRange().length}, 1fr)` }}>
                {getDatesInRange().map((date, i) => (
                  <div key={i} className="p-3 border-r text-center bg-gray-50">
                    <div className="text-xs text-gray-500">
                      {date.toLocaleDateString('en-ZA', { weekday: 'short' })}
                    </div>
                    <div className="font-medium">
                      {date.toLocaleDateString('en-ZA', { day: 'numeric', month: 'short' })}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Instructor Rows */}
            {instructors.map(instructor => (
              <div key={instructor.id} className="grid grid-cols-[200px_1fr] border-b last:border-b-0">
                <div className="p-4 border-r flex items-center">
                  <div>
                    <div className="font-medium text-gray-900">{instructor.full_name || 'Unnamed'}</div>
                    <div className="text-xs text-gray-500">Instructor</div>
                  </div>
                </div>
                <div className="grid" style={{ gridTemplateColumns: `repeat(${getDatesInRange().length}, 1fr)` }}>
                  {getDatesInRange().map((date, i) => (
                    <div
                      key={i}
                      className="p-2 border-r min-h-[120px] bg-gray-50/30 hover:bg-blue-50/30 transition-colors cursor-pointer"
                      onClick={() => {
                        // Open new booking form for this slot
                        console.log('New booking for', instructor.id, date);
                      }}
                    >
                      {getBookingsForInstructor(instructor.id, date).map(booking => (
                        <div
                          key={booking.id}
                          className={`mb-2 p-2 rounded border text-xs ${getStatusColor(booking.status)} cursor-pointer hover:shadow-md transition-shadow`}
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedBooking(booking);
                          }}
                        >
                          <div className="font-medium truncate">
                            {booking.customer?.first_name} {booking.customer?.last_name}
                          </div>
                          <div className="text-[10px] opacity-80">
                            {formatTime(booking.start_time)} - {formatTime(booking.end_time)}
                          </div>
                          <div className="text-[10px] opacity-70 truncate">
                            {booking.course?.name}
                          </div>
                        </div>
                      ))}
                    </div>
                  ))}
                </div>
              </div>
            ))}

            {instructors.length === 0 && (
              <div className="p-12 text-center text-gray-500">
                No instructors found. Add instructors in the dashboard settings.
              </div>
            )}
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow p-12 text-center">
            <p className="text-gray-500">Resource view coming soon...</p>
          </div>
        )}

        {/* Booking Detail Side Panel */}
        {selectedBooking && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold">Booking Details</h3>
                <button
                  onClick={() => setSelectedBooking(null)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  ✕
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="text-xs text-gray-500">Booking Number</label>
                  <p className="font-medium">{selectedBooking.booking_number}</p>
                </div>
                <div>
                  <label className="text-xs text-gray-500">Customer</label>
                  <p className="font-medium">
                    {selectedBooking.customer?.first_name} {selectedBooking.customer?.last_name}
                  </p>
                </div>
                <div>
                  <label className="text-xs text-gray-500">Course</label>
                  <p className="font-medium">{selectedBooking.course?.name}</p>
                </div>
                <div>
                  <label className="text-xs text-gray-500">Instructor</label>
                  <p className="font-medium">{selectedBooking.instructor?.full_name || 'Not assigned'}</p>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs text-gray-500">Start</label>
                    <p className="font-medium">
                      {new Date(selectedBooking.start_time).toLocaleDateString('en-ZA', {
                        weekday: 'short',
                        day: 'numeric',
                        month: 'short',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </p>
                  </div>
                  <div>
                    <label className="text-xs text-gray-500">End</label>
                    <p className="font-medium">
                      {new Date(selectedBooking.end_time).toLocaleDateString('en-ZA', {
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </p>
                  </div>
                </div>
                <div>
                  <label className="text-xs text-gray-500">Status</label>
                  <p className={`inline-block px-2 py-1 rounded text-xs font-medium ${getStatusColor(selectedBooking.status)}`}>
                    {selectedBooking.status.replace('_', ' ').toUpperCase()}
                  </p>
                </div>
              </div>

              <div className="mt-6 flex gap-2">
                <button className="flex-1 bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700">
                  Reschedule
                </button>
                <button className="flex-1 border border-gray-300 px-4 py-2 rounded hover:bg-gray-50">
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
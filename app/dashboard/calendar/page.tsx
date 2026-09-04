'use client';

export const dynamic = 'force-dynamic';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { isBookingInInstructorLane } from '@/lib/calendar';

type CalendarView = 'day' | 'week' | 'month';
type ViewMode = 'instructor' | 'resource';

interface Booking {
  id: string;
  booking_number: string;
  customer: { first_name: string; last_name: string };
  course: { name: string };
  instructor: { id: string; full_name: string } | null;
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

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const startDate = getStartDate(currentDate, view);
      const endDate = getEndDate(currentDate, view);
      const response = await fetch(
        `/api/calendar?start=${encodeURIComponent(startDate.toISOString())}&end=${encodeURIComponent(endDate.toISOString())}`,
        { cache: 'no-store' },
      );
      const json = await response.json();

      if (!response.ok || json.error) {
        throw new Error(json.error || 'Failed to fetch calendar data');
      }

      setBookings((json.data as Booking[]) ?? []);
      setInstructors((json.instructors as Instructor[]) ?? []);
    } catch (err) {
      console.error('Calendar load error:', err);
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setLoading(false);
    }
  }, [currentDate, view]);

  useEffect(() => {
    // Loading remote calendar data is the effect's synchronization boundary.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void loadData();
  }, [loadData]);

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
      timeZone: 'Africa/Johannesburg',
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
    return bookings.filter((booking) =>
      isBookingInInstructorLane(booking, instructorId, date),
    );
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
    <div className="min-h-screen bg-gray-50 p-4 sm:p-6">
      <div className="mx-auto max-w-7xl">
        {/* Header */}
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Calendar</h1>
            <p className="text-gray-600 mt-1">View and manage bookings across instructors</p>
          </div>
          <Link
            href="/dashboard/bookings"
            className="inline-flex min-h-11 items-center rounded-lg bg-blue-600 px-4 py-2 text-white transition-colors hover:bg-blue-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-2"
          >
            New Booking
          </Link>
        </div>

        {/* Controls */}
        <div className="mb-6 flex flex-wrap items-center gap-3 rounded-lg border border-gray-200 bg-white p-3 shadow-sm sm:gap-4 sm:p-4">
          <div className="flex items-center gap-2">
            <button
              type="button"
              aria-label={`Previous ${view}`}
              onClick={() => navigate('prev')}
              className="grid min-h-11 min-w-11 place-items-center rounded hover:bg-gray-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600"
            >
              ←
            </button>
            <span className="min-w-[170px] text-center text-sm font-medium sm:min-w-[240px]">
              {formatDate(getStartDate(currentDate, view))} – {formatDate(getEndDate(currentDate, view))}
            </span>
            <button
              type="button"
              aria-label={`Next ${view}`}
              onClick={() => navigate('next')}
              className="grid min-h-11 min-w-11 place-items-center rounded hover:bg-gray-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600"
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
          <div className="overflow-x-auto rounded-lg border border-gray-200 bg-white shadow-sm">
            <div style={{ minWidth: `${200 + getDatesInRange().length * 150}px` }}>
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
                  type="button"
                  aria-label="Close booking details"
                  onClick={() => setSelectedBooking(null)}
                  className="grid min-h-11 min-w-11 place-items-center rounded text-gray-500 hover:bg-gray-100 hover:text-gray-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600"
                >
                  <svg aria-hidden="true" viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M6 6l12 12M18 6L6 18" />
                  </svg>
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
                      timeZone: 'Africa/Johannesburg',
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
                      timeZone: 'Africa/Johannesburg',
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
                <Link
                  href="/dashboard/bookings"
                  className="inline-flex min-h-11 flex-1 items-center justify-center rounded bg-blue-600 px-4 py-2 text-white hover:bg-blue-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-2"
                >
                  Open bookings
                </Link>
                <button
                  type="button"
                  onClick={() => setSelectedBooking(null)}
                  className="min-h-11 flex-1 rounded border border-gray-300 px-4 py-2 hover:bg-gray-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

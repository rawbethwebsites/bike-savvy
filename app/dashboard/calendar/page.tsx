'use client';

import { useState } from 'react';
import Link from 'next/link';

type ViewMode = 'day' | 'week' | 'month';

// Mock data
const instructors = ['Daniel', 'Michael'];
const mockBookings = [
  { id: '1', customer: 'Lerato M.', course: 'Beginner Rider', instructor: 'Daniel', start: '09:00', end: '11:00', status: 'confirmed', day: 'today' },
  { id: '2', customer: 'John D.', course: 'Licence Prep', instructor: 'Michael', start: '11:30', end: '13:30', status: 'confirmed', day: 'today' },
  { id: '3', customer: 'Sarah W.', course: 'Practical Skills', instructor: 'Daniel', start: '14:00', end: '16:00', status: 'pending_payment', day: 'today' },
  { id: '4', customer: 'Ethan R.', course: 'Beginner Rider', instructor: 'Daniel', start: '09:00', end: '11:00', status: 'confirmed', day: 'tomorrow' },
  { id: '5', customer: 'Liam K.', course: 'Licence Prep', instructor: 'Michael', start: '10:30', end: '12:30', status: 'confirmed', day: 'tomorrow' },
];

export default function CalendarPage() {
  const [viewMode, setViewMode] = useState<ViewMode>('week');
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [selectedBooking, setSelectedBooking] = useState<any>(null);

  const today = new Date();
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  const timeSlots = Array.from({ length: 10 }, (_, i) => i + 8); // 8:00 to 17:00

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link href="/dashboard" className="text-gray-500 hover:text-gray-700">
                ← Back
              </Link>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Calendar</h1>
                <p className="text-sm text-gray-500 mt-1">
                  {selectedDate.toLocaleDateString('en-ZA', { 
                    weekday: 'long', 
                    year: 'numeric', 
                    month: 'long', 
                    day: 'numeric' 
                  })}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex bg-gray-100 rounded-md p-1">
                <button
                  onClick={() => setViewMode('day')}
                  className={`px-3 py-1.5 text-sm font-medium rounded ${
                    viewMode === 'day' ? 'bg-white shadow text-gray-900' : 'text-gray-600'
                  }`}
                >
                  Day
                </button>
                <button
                  onClick={() => setViewMode('week')}
                  className={`px-3 py-1.5 text-sm font-medium rounded ${
                    viewMode === 'week' ? 'bg-white shadow text-gray-900' : 'text-gray-600'
                  }`}
                >
                  Week
                </button>
                <button
                  onClick={() => setViewMode('month')}
                  className={`px-3 py-1.5 text-sm font-medium rounded ${
                    viewMode === 'month' ? 'bg-white shadow text-gray-900' : 'text-gray-600'
                  }`}
                >
                  Month
                </button>
              </div>
              <button className="text-sm bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700">
                New Booking
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Filters */}
        <div className="mb-6 flex items-center gap-4">
          <select className="border border-gray-300 rounded-md px-3 py-2 text-sm bg-white">
            <option>All Instructors</option>
            {instructors.map((inst) => (
              <option key={inst}>{inst}</option>
            ))}
          </select>
          <select className="border border-gray-300 rounded-md px-3 py-2 text-sm bg-white">
            <option>All Courses</option>
            <option>Beginner Rider</option>
            <option>Licence Prep</option>
            <option>Practical Skills</option>
          </select>
          <label className="flex items-center gap-2 text-sm text-gray-600">
            <input type="checkbox" className="rounded border-gray-300" />
            Show Resources
          </label>
        </div>

        {/* Calendar Grid - Week View */}
        {viewMode === 'week' && (
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <div className="grid grid-cols-3 border-b border-gray-200">
              <div className="p-4 border-r border-gray-200 bg-gray-50 font-medium text-gray-700">
                Time
              </div>
              {instructors.map((instructor) => (
                <div key={instructor} className="p-4 border-r border-gray-200 bg-gray-50 font-medium text-gray-700">
                  {instructor}
                </div>
              ))}
            </div>
            
            <div className="divide-y divide-gray-200">
              {timeSlots.map((hour) => (
                <div key={hour} className="grid grid-cols-3 min-h-[80px]">
                  <div className="p-4 border-r border-gray-200 text-sm text-gray-500">
                    {hour.toString().padStart(2, '0')}:00
                  </div>
                  {instructors.map((instructor) => {
                    const booking = mockBookings.find(
                      (b) => 
                        b.instructor === instructor && 
                        b.day === 'today' &&
                        parseInt(b.start) === hour
                    );
                    
                    return (
                      <div key={instructor} className="p-2 border-r border-gray-200 relative">
                        {booking && (
                          <div
                            onClick={() => setSelectedBooking(booking)}
                            className={`p-3 rounded-lg cursor-pointer transition-colors ${
                              booking.status === 'confirmed'
                                ? 'bg-green-100 hover:bg-green-200 border-l-4 border-green-500'
                                : 'bg-yellow-100 hover:bg-yellow-200 border-l-4 border-yellow-500'
                            }`}
                          >
                            <p className="font-medium text-gray-900 text-sm">{booking.customer}</p>
                            <p className="text-xs text-gray-600">{booking.course}</p>
                            <p className="text-xs text-gray-500 mt-1">
                              {booking.start} - {booking.end}
                            </p>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Day View */}
        {viewMode === 'day' && (
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <div className="divide-y divide-gray-200">
              {timeSlots.map((hour) => (
                <div key={hour} className="flex min-h-[80px]">
                  <div className="w-24 p-4 border-r border-gray-200 text-sm text-gray-500 flex-shrink-0">
                    {hour.toString().padStart(2, '0')}:00
                  </div>
                  <div className="flex-1 p-2">
                    {mockBookings
                      .filter((b) => b.day === 'today' && parseInt(b.start) === hour)
                      .map((booking) => (
                        <div
                          key={booking.id}
                          onClick={() => setSelectedBooking(booking)}
                          className={`mb-2 p-4 rounded-lg cursor-pointer transition-colors ${
                            booking.status === 'confirmed'
                              ? 'bg-green-50 hover:bg-green-100 border-l-4 border-green-500'
                              : 'bg-yellow-50 hover:bg-yellow-100 border-l-4 border-yellow-500'
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="font-medium text-gray-900">{booking.customer}</p>
                              <p className="text-sm text-gray-600">{booking.course}</p>
                            </div>
                            <div className="text-right">
                              <p className="text-sm text-gray-500">{booking.instructor}</p>
                              <p className="text-xs text-gray-500">{booking.start} - {booking.end}</p>
                            </div>
                          </div>
                        </div>
                      ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Month View Placeholder */}
        {viewMode === 'month' && (
          <div className="bg-white rounded-lg shadow p-6 text-center">
            <p className="text-gray-500">Month view coming soon</p>
            <p className="text-sm text-gray-400 mt-2">Switch to Day or Week view for now</p>
          </div>
        )}
      </main>

      {/* Booking Detail Modal */}
      {selectedBooking && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
            <div className="p-6 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">Booking Details</h3>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <p className="text-sm text-gray-500">Customer</p>
                <p className="font-medium text-gray-900">{selectedBooking.customer}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Course</p>
                <p className="font-medium text-gray-900">{selectedBooking.course}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Instructor</p>
                <p className="font-medium text-gray-900">{selectedBooking.instructor}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Time</p>
                <p className="font-medium text-gray-900">
                  {selectedBooking.start} - {selectedBooking.end}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Status</p>
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                  selectedBooking.status === 'confirmed'
                    ? 'bg-green-100 text-green-700'
                    : 'bg-yellow-100 text-yellow-700'
                }`}>
                  {selectedBooking.status}
                </span>
              </div>
            </div>
            <div className="p-6 border-t border-gray-200 flex gap-3">
              <button
                onClick={() => setSelectedBooking(null)}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 font-medium"
              >
                Close
              </button>
              <button className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 font-medium">
                Edit Booking
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

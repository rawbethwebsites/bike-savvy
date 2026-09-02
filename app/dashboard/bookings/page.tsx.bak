'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { validateBookingProposal } from '@/lib/booking/engine';

interface Booking {
  id: string;
  booking_number: string;
  start_time: string;
  end_time: string;
  status: string;
  customer: { first_name: string; last_name: string; phone: string };
  course: { name: string; duration_minutes: number };
  instructor: { full_name: string } | null;
  price_cents: number;
  payment_status: string;
}

interface Customer {
  id: string;
  first_name: string;
  last_name: string;
  phone: string;
}

interface Course {
  id: string;
  name: string;
  duration_minutes: number;
  price_cents: number;
}

interface Instructor {
  id: string;
  full_name: string;
}

export default function BookingsPage() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [instructors, setInstructors] = useState<Instructor[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('list');

  // New booking form state
  const [newBooking, setNewBooking] = useState({
    customerId: '',
    courseId: '',
    instructorId: '',
    date: '',
    time: '',
    duration: 120,
    notes: '',
  });
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const [creating, setCreating] = useState(false);

  const supabase = createClient();

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    setLoading(true);

    // Fetch bookings
    const { data: bookingsData } = await supabase
      .from('bookings')
      .select(`
        id,
        booking_number,
        start_time,
        end_time,
        status,
        price_cents,
        payment_status,
        customer:customers(first_name, last_name, phone),
        course:courses(name, duration_minutes),
        instructor:instructors(full_name)
      `)
      .order('start_time', { ascending: false });

    // Fetch customers
    const { data: customersData } = await supabase
      .from('customers')
      .select('id, first_name, last_name, phone')
      .order('last_name');

    // Fetch courses
    const { data: coursesData } = await supabase
      .from('courses')
      .select('id, name, duration_minutes, price_cents')
      .eq('is_active', true);

    // Fetch instructors
    const { data: instructorsData } = await supabase
      .from('instructors')
      .select(`
        id,
        full_name:dashboard_users(full_name)
      `)
      .eq('is_active', true);

    if (bookingsData) setBookings(bookingsData as unknown as Booking[]);
    if (customersData) setCustomers(customersData as unknown as Customer[]);
    if (coursesData) setCourses(coursesData as unknown as Course[]);
    if (instructorsData) setInstructors(instructorsData as unknown as Instructor[]);

    setLoading(false);
  }

  async function handleCreateBooking() {
    setCreating(true);
    setValidationErrors([]);

    if (!newBooking.customerId || !newBooking.courseId || !newBooking.date || !newBooking.time) {
      setValidationErrors(['Please fill in all required fields']);
      setCreating(false);
      return;
    }

    // Build proposal for validation
    const startDate = new Date(`${newBooking.date}T${newBooking.time}`);
    const endDate = new Date(startDate.getTime() + newBooking.duration * 60000);

    const proposal = {
      customerId: newBooking.customerId,
      courseId: newBooking.courseId,
      instructorId: newBooking.instructorId || undefined,
      startTime: startDate,
      endTime: endDate,
      resourceIds: [] as string[],
    };

    // Validate using booking engine
    const result = await validateBookingProposal(supabase, proposal);

    if (!result.isValid) {
      setValidationErrors(result.errors);
      setCreating(false);
      return;
    }

    // Create booking
    const { data, error } = await supabase
      .from('bookings')
      .insert({
        booking_number: `BK-${Date.now()}`,
        customer_id: newBooking.customerId,
        course_id: newBooking.courseId,
        instructor_id: newBooking.instructorId || null,
        start_time: startDate.toISOString(),
        end_time: endDate.toISOString(),
        status: 'held',
        price_cents: result.priceBreakdown.total,
        deposit_paid_cents: result.priceBreakdown.deposit,
        payment_status: 'unpaid',
        source: 'dashboard',
        notes: newBooking.notes,
        created_by: (await supabase.auth.getUser()).data.user?.id || '',
      })
      .select()
      .single();

    if (error) {
      setValidationErrors([error.message]);
      setCreating(false);
      return;
    }

    // Success
    setShowCreateModal(false);
    setNewBooking({
      customerId: '',
      courseId: '',
      instructorId: '',
      date: '',
      time: '',
      duration: 120,
      notes: '',
    });
    loadData();
    setCreating(false);
  }

  function filteredBookings() {
    return bookings.filter(booking => {
      const matchesSearch = 
        booking.booking_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
        booking.customer?.first_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        booking.customer?.last_name?.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesStatus = statusFilter === 'all' || booking.status === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }

  function formatCurrency(cents: number) {
    return `R${(cents / 100).toLocaleString('en-ZA', { minimumFractionDigits: 2 })}`;
  }

  function formatDateTime(dateString: string) {
    return new Date(dateString).toLocaleDateString('en-ZA', {
      weekday: 'short',
      day: 'numeric',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit',
    });
  }

  function getStatusBadgeClass(status: string) {
    switch (status) {
      case 'confirmed': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'checked_in': return 'bg-green-100 text-green-800 border-green-200';
      case 'held': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'pending_payment': return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'completed': return 'bg-gray-100 text-gray-800 border-gray-200';
      case 'cancelled': return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Bookings</h1>
            <p className="text-gray-600 mt-1">Manage all bookings, create new sessions, and track payments</p>
          </div>
          <button
            onClick={() => setShowCreateModal(true)}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center gap-2"
          >
            <span>+</span>
            New Booking
          </button>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-lg shadow p-4 mb-6">
          <div className="flex flex-wrap gap-4">
            <div className="flex-1 min-w-[250px]">
              <input
                type="text"
                placeholder="Search by booking #, customer name..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Statuses</option>
              <option value="draft">Draft</option>
              <option value="held">Held</option>
              <option value="pending_payment">Pending Payment</option>
              <option value="confirmed">Confirmed</option>
              <option value="checked_in">Checked In</option>
              <option value="completed">Completed</option>
              <option value="cancelled">Cancelled</option>
            </select>
            <div className="flex items-center gap-2 border-l pl-4">
              <button
                onClick={() => setViewMode('list')}
                className={`px-3 py-2 rounded ${viewMode === 'list' ? 'bg-blue-100 text-blue-700' : 'hover:bg-gray-100'}`}
              >
                List
              </button>
              <button
                onClick={() => setViewMode('grid')}
                className={`px-3 py-2 rounded ${viewMode === 'grid' ? 'bg-blue-100 text-blue-700' : 'hover:bg-gray-100'}`}
              >
                Grid
              </button>
            </div>
          </div>
        </div>

        {/* Bookings List */}
        {loading ? (
          <div className="bg-white rounded-lg shadow p-12 text-center">
            <p className="text-gray-500">Loading bookings...</p>
          </div>
        ) : filteredBookings().length === 0 ? (
          <div className="bg-white rounded-lg shadow p-12 text-center">
            <p className="text-gray-500 mb-4">No bookings found</p>
            <button
              onClick={() => setShowCreateModal(true)}
              className="text-blue-600 hover:underline"
            >
              Create your first booking
            </button>
          </div>
        ) : viewMode === 'list' ? (
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <table className="w-full">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Booking #
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Customer
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Course
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Date & Time
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Instructor
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Price
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredBookings().map(booking => (
                  <tr
                    key={booking.id}
                    className="hover:bg-gray-50 cursor-pointer"
                    onClick={() => setSelectedBooking(booking)}
                  >
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {booking.booking_number}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {booking.customer?.first_name} {booking.customer?.last_name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {booking.course?.name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatDateTime(booking.start_time)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {booking.instructor?.full_name || 'Not assigned'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {formatCurrency(booking.price_cents)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 text-xs font-medium rounded-full border ${getStatusBadgeClass(booking.status)}`}>
                        {booking.status.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      View
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredBookings().map(booking => (
              <div
                key={booking.id}
                onClick={() => setSelectedBooking(booking)}
                className="bg-white rounded-lg shadow p-4 hover:shadow-md transition-shadow cursor-pointer"
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-medium text-gray-500">{booking.booking_number}</span>
                  <span className={`px-2 py-1 text-xs font-medium rounded-full border ${getStatusBadgeClass(booking.status)}`}>
                    {booking.status.replace('_', ' ')}
                  </span>
                </div>
                <h3 className="font-semibold text-gray-900 mb-1">
                  {booking.customer?.first_name} {booking.customer?.last_name}
                </h3>
                <p className="text-sm text-gray-600 mb-2">{booking.course?.name}</p>
                <div className="text-xs text-gray-500 mb-3">
                  {formatDateTime(booking.start_time)}
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-900">
                    {formatCurrency(booking.price_cents)}
                  </span>
                  <span className="text-xs text-gray-500">
                    {booking.instructor?.full_name || 'No instructor'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Create Booking Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold">Create New Booking</h3>
                <button
                  onClick={() => setShowCreateModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  ✕
                </button>
              </div>

              {validationErrors.length > 0 && (
                <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
                  <h4 className="text-sm font-medium text-red-800 mb-2">Validation Errors:</h4>
                  <ul className="text-sm text-red-700 list-disc list-inside space-y-1">
                    {validationErrors.map((error, i) => (
                      <li key={i}>{error}</li>
                    ))}
                  </ul>
                </div>
              )}

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Customer <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={newBooking.customerId}
                    onChange={(e) => setNewBooking({ ...newBooking, customerId: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Select customer...</option>
                    {customers.map(customer => (
                      <option key={customer.id} value={customer.id}>
                        {customer.first_name} {customer.last_name} - {customer.phone}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Course <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={newBooking.courseId}
                    onChange={(e) => {
                      const course = courses.find(c => c.id === e.target.value);
                      setNewBooking({ 
                        ...newBooking, 
                        courseId: e.target.value,
                        duration: course?.duration_minutes || 120
                      });
                    }}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Select course...</option>
                    {courses.map(course => (
                      <option key={course.id} value={course.id}>
                        {course.name} ({course.duration_minutes} min) - {formatCurrency(course.price_cents)}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Instructor
                  </label>
                  <select
                    value={newBooking.instructorId}
                    onChange={(e) => setNewBooking({ ...newBooking, instructorId: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Not assigned</option>
                    {instructors.map(instructor => (
                      <option key={instructor.id} value={instructor.id}>
                        {instructor.full_name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Date <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="date"
                      value={newBooking.date}
                      onChange={(e) => setNewBooking({ ...newBooking, date: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Time <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="time"
                      value={newBooking.time}
                      onChange={(e) => setNewBooking({ ...newBooking, time: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Duration (minutes)
                  </label>
                  <input
                    type="number"
                    value={newBooking.duration}
                    onChange={(e) => setNewBooking({ ...newBooking, duration: parseInt(e.target.value) || 0 })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Notes
                  </label>
                  <textarea
                    value={newBooking.notes}
                    onChange={(e) => setNewBooking({ ...newBooking, notes: e.target.value })}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div className="mt-6 flex gap-3">
                <button
                  onClick={() => setShowCreateModal(false)}
                  className="flex-1 border border-gray-300 px-4 py-2 rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleCreateBooking}
                  disabled={creating}
                  className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50"
                >
                  {creating ? 'Creating...' : 'Create Booking'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Booking Detail Modal */}
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
            <div className="space-y-3">
              <div>
                <p className="text-xs text-gray-500">Booking Number</p>
                <p className="font-medium">{selectedBooking.booking_number}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500">Customer</p>
                <p className="font-medium">
                  {selectedBooking.customer?.first_name} {selectedBooking.customer?.last_name}
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-500">Course</p>
                <p className="font-medium">{selectedBooking.course?.name}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500">Date & Time</p>
                <p className="font-medium">{formatDateTime(selectedBooking.start_time)}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500">Status</p>
                <span className={`inline-block px-2 py-1 text-xs font-medium rounded ${getStatusBadgeClass(selectedBooking.status)}`}>
                  {selectedBooking.status.replace('_', ' ')}
                </span>
              </div>
            </div>
            <div className="mt-6 flex gap-2">
              <button className="flex-1 bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700">
                Edit
              </button>
              <button className="flex-1 border border-gray-300 px-4 py-2 rounded hover:bg-gray-50">
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

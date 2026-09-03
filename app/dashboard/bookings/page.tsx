'use client';

import { FormEvent, useEffect, useMemo, useState } from 'react';

type Customer = { id: string; first_name: string; last_name: string; phone: string };
type Course = { id: string; name: string; duration_minutes: number; price_cents: number; deposit_cents: number };
type Instructor = { id: string; full_name: string };
type Booking = {
  id: string;
  booking_number: string;
  start_time: string;
  end_time: string;
  status: string;
  price_cents: number;
  payment_status: string;
  notes: string | null;
  location: string | null;
  customer: Customer | null;
  course: Course | null;
  instructor: Instructor | null;
};

type BookingForm = { customerId: string; courseId: string; instructorId: string; date: string; time: string; notes: string };
const emptyForm: BookingForm = { customerId: '', courseId: '', instructorId: '', date: '', time: '', notes: '' };

function johannesburgToday() {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Africa/Johannesburg', year: 'numeric', month: '2-digit', day: '2-digit',
  }).format(new Date()).replace(/\//g, '-');
}

function formatDateTime(value: string) {
  return new Intl.DateTimeFormat('en-ZA', {
    timeZone: 'Africa/Johannesburg', weekday: 'short', day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit', hour12: false,
  }).format(new Date(value));
}

function formatCurrency(cents: number) {
  return new Intl.NumberFormat('en-ZA', { style: 'currency', currency: 'ZAR' }).format(cents / 100);
}

function statusClass(status: string) {
  const styles: Record<string, string> = {
    held: 'bg-yellow-100 text-yellow-800 border-yellow-200', pending_payment: 'bg-orange-100 text-orange-800 border-orange-200',
    confirmed: 'bg-blue-100 text-blue-800 border-blue-200', checked_in: 'bg-green-100 text-green-800 border-green-200',
    completed: 'bg-gray-100 text-gray-800 border-gray-200', cancelled: 'bg-red-100 text-red-800 border-red-200',
  };
  return styles[status] ?? 'bg-gray-100 text-gray-800 border-gray-200';
}

export default function BookingsPage() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [instructors, setInstructors] = useState<Instructor[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('all');
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState<BookingForm>(emptyForm);
  const [formError, setFormError] = useState('');
  const [creating, setCreating] = useState(false);

  async function loadBookings() {
    setLoading(true);
    setLoadError('');
    try {
      const response = await fetch('/api/bookings', { cache: 'no-store' });
      const payload = await response.json() as { bookings?: Booking[]; customers?: Customer[]; courses?: Course[]; instructors?: Instructor[]; error?: string };
      if (!response.ok) throw new Error(payload.error ?? 'Unable to load bookings.');
      setBookings(payload.bookings ?? []);
      setCustomers(payload.customers ?? []);
      setCourses(payload.courses ?? []);
      setInstructors(payload.instructors ?? []);
    } catch (error) {
      setLoadError(error instanceof Error ? error.message : 'Unable to load bookings.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    const timer = window.setTimeout(() => { void loadBookings(); }, 0);
    return () => window.clearTimeout(timer);
  }, []);

  const filteredBookings = useMemo(() => {
    const searchValue = search.trim().toLowerCase();
    return bookings.filter((booking) => {
      const customerName = `${booking.customer?.first_name ?? ''} ${booking.customer?.last_name ?? ''}`.toLowerCase();
      return (status === 'all' || booking.status === status)
        && (!searchValue || booking.booking_number.toLowerCase().includes(searchValue) || customerName.includes(searchValue) || (booking.course?.name ?? '').toLowerCase().includes(searchValue));
    });
  }, [bookings, search, status]);

  function openNewBooking() {
    setForm({ ...emptyForm, date: johannesburgToday() });
    setFormError('');
    setShowForm(true);
  }

  async function submitBooking(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!form.customerId || !form.courseId || !form.date || !form.time) {
      setFormError('Customer, course, date, and time are required.');
      return;
    }
    setCreating(true);
    setFormError('');
    try {
      const response = await fetch('/api/bookings', {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form),
      });
      const payload = await response.json() as { error?: string };
      if (!response.ok) throw new Error(payload.error ?? 'Unable to create booking.');
      setShowForm(false);
      setForm(emptyForm);
      await loadBookings();
    } catch (error) {
      setFormError(error instanceof Error ? error.message : 'Unable to create booking.');
    } finally {
      setCreating(false);
    }
  }

  const selectedCourse = courses.find((course) => course.id === form.courseId);

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Bookings</h1>
            <p className="text-gray-600 mt-1">Create and manage training sessions in Johannesburg time.</p>
          </div>
          <button onClick={openNewBooking} className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700">+ New Booking</button>
        </div>

        <div className="bg-white rounded-lg shadow p-4 mb-6 flex flex-wrap gap-4">
          <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search booking, customer, or course..." className="flex-1 min-w-60 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" />
          <select value={status} onChange={(event) => setStatus(event.target.value)} className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500">
            <option value="all">All statuses</option><option value="draft">Draft</option><option value="held">Held</option><option value="pending_payment">Pending payment</option><option value="confirmed">Confirmed</option><option value="checked_in">Checked in</option><option value="completed">Completed</option><option value="cancelled">Cancelled</option>
          </select>
        </div>

        {loading ? <div className="bg-white rounded-lg shadow p-12 text-center text-gray-500">Loading bookings...</div> : loadError ? (
          <div className="bg-white rounded-lg shadow p-12 text-center"><p className="text-red-600">{loadError}</p><button onClick={() => void loadBookings()} className="mt-4 text-blue-600 hover:underline">Try again</button></div>
        ) : filteredBookings.length === 0 ? (
          <div className="bg-white rounded-lg shadow p-12 text-center"><p className="text-gray-500">No bookings found.</p><button onClick={openNewBooking} className="mt-4 text-blue-600 hover:underline">Create a booking</button></div>
        ) : (
          <div className="bg-white rounded-lg shadow overflow-x-auto"><table className="w-full min-w-[850px]"><thead className="bg-gray-50 border-b"><tr>{['Booking #', 'Customer', 'Course', 'Date & time', 'Instructor', 'Price', 'Status', ''].map((heading) => <th key={heading} className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{heading}</th>)}</tr></thead>
            <tbody className="divide-y divide-gray-200">{filteredBookings.map((booking) => <tr key={booking.id} className="hover:bg-gray-50"><td className="px-6 py-4 text-sm font-medium text-gray-900">{booking.booking_number}</td><td className="px-6 py-4 text-sm text-gray-900">{booking.customer ? `${booking.customer.first_name} ${booking.customer.last_name}` : 'Unknown customer'}</td><td className="px-6 py-4 text-sm text-gray-900">{booking.course?.name ?? 'Unknown course'}</td><td className="px-6 py-4 text-sm text-gray-500">{formatDateTime(booking.start_time)}</td><td className="px-6 py-4 text-sm text-gray-500">{booking.instructor?.full_name ?? 'Unassigned'}</td><td className="px-6 py-4 text-sm text-gray-900">{formatCurrency(booking.price_cents)}</td><td className="px-6 py-4"><span className={`px-2 py-1 text-xs font-medium rounded-full border ${statusClass(booking.status)}`}>{booking.status.replace('_', ' ')}</span></td><td className="px-6 py-4"><button onClick={() => setSelectedBooking(booking)} className="text-sm text-blue-600 hover:underline">Details</button></td></tr>)}</tbody>
          </table></div>
        )}
      </div>

      {showForm && <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50"><form onSubmit={submitBooking} className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6"><div className="flex items-center justify-between mb-6"><h2 className="text-lg font-semibold">New Booking</h2><button type="button" onClick={() => setShowForm(false)} className="text-gray-400 hover:text-gray-600">✕</button></div>
        {formError && <p className="mb-4 p-3 bg-red-50 border border-red-200 rounded text-sm text-red-700">{formError}</p>}
        <div className="space-y-4"><label className="block text-sm font-medium text-gray-700">Customer *<select required value={form.customerId} onChange={(event) => setForm({ ...form, customerId: event.target.value })} className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-lg"><option value="">Select customer...</option>{customers.map((customer) => <option key={customer.id} value={customer.id}>{customer.first_name} {customer.last_name} — {customer.phone}</option>)}</select></label>
          <label className="block text-sm font-medium text-gray-700">Course *<select required value={form.courseId} onChange={(event) => setForm({ ...form, courseId: event.target.value })} className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-lg"><option value="">Select course...</option>{courses.map((course) => <option key={course.id} value={course.id}>{course.name} ({course.duration_minutes} min) — {formatCurrency(course.price_cents)}</option>)}</select></label>
          <label className="block text-sm font-medium text-gray-700">Instructor <select value={form.instructorId} onChange={(event) => setForm({ ...form, instructorId: event.target.value })} className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-lg"><option value="">Unassigned</option>{instructors.map((instructor) => <option key={instructor.id} value={instructor.id}>{instructor.full_name}</option>)}</select></label>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4"><label className="block text-sm font-medium text-gray-700">Date *<input required type="date" value={form.date} onChange={(event) => setForm({ ...form, date: event.target.value })} className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-lg" /></label><label className="block text-sm font-medium text-gray-700">Time *<input required type="time" value={form.time} onChange={(event) => setForm({ ...form, time: event.target.value })} className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-lg" /></label></div>
          {selectedCourse && <p className="text-sm text-gray-500">Session length: {selectedCourse.duration_minutes} minutes. Times use Africa/Johannesburg.</p>}
          <label className="block text-sm font-medium text-gray-700">Notes<textarea value={form.notes} onChange={(event) => setForm({ ...form, notes: event.target.value })} rows={3} className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-lg" /></label></div>
        <div className="mt-6 flex gap-3"><button type="button" onClick={() => setShowForm(false)} className="flex-1 border border-gray-300 px-4 py-2 rounded-lg hover:bg-gray-50">Cancel</button><button type="submit" disabled={creating} className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50">{creating ? 'Creating...' : 'Create booking'}</button></div>
      </form></div>}

      {selectedBooking && <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50"><div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6"><div className="flex items-center justify-between mb-5"><h2 className="text-lg font-semibold">Booking Details</h2><button onClick={() => setSelectedBooking(null)} className="text-gray-400 hover:text-gray-600">✕</button></div><div className="space-y-3 text-sm"><Detail label="Booking number" value={selectedBooking.booking_number} /><Detail label="Customer" value={selectedBooking.customer ? `${selectedBooking.customer.first_name} ${selectedBooking.customer.last_name}` : 'Unknown customer'} /><Detail label="Course" value={selectedBooking.course?.name ?? 'Unknown course'} /><Detail label="Instructor" value={selectedBooking.instructor?.full_name ?? 'Unassigned'} /><Detail label="Start" value={formatDateTime(selectedBooking.start_time)} /><Detail label="End" value={formatDateTime(selectedBooking.end_time)} /><Detail label="Price" value={formatCurrency(selectedBooking.price_cents)} /><Detail label="Payment" value={selectedBooking.payment_status.replace('_', ' ')} />{selectedBooking.notes && <Detail label="Notes" value={selectedBooking.notes} />}</div></div></div>}
    </div>
  );
}

function Detail({ label, value }: { label: string; value: string }) { return <div><p className="text-xs text-gray-500">{label}</p><p className="font-medium text-gray-900">{value}</p></div>; }

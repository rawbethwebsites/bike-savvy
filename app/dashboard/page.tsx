'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import LiveChatButton from '@/app/components/LiveChatButton';

interface DashboardData {
  bookingsToday: number;
  instructorsWorking: number;
  expectedRevenue: number;
  pendingPayments: number;
  schedule: Array<{
    id: string;
    time: string;
    customer: string;
    course: string;
    instructor: string;
    status: string;
  }>;
  issues: Array<{
    id: string;
    type: string;
    message: string;
    severity: 'low' | 'medium' | 'high';
  }>;
}

export default function TodayDashboard() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchDashboard() {
      try {
        const res = await fetch('/api/dashboard');
        if (!res.ok) throw new Error('Failed to fetch dashboard data');
        const jsonData = await res.json();
        setData(jsonData);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error');
      } finally {
        setIsLoading(false);
      }
    }

    fetchDashboard();
  }, []);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 font-semibold">Error loading dashboard</p>
          <p className="text-gray-600 mt-2">{error || 'Unknown error'}</p>
          <button 
            onClick={() => window.location.reload()}
            className="mt-4 text-blue-600 hover:underline"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <LiveChatButton />
      {/* Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Bike Savvy Dashboard</h1>
              <p className="text-sm text-gray-500 mt-1">
                {new Date().toLocaleDateString('en-ZA', { 
                  weekday: 'long', 
                  year: 'numeric', 
                  month: 'long', 
                  day: 'numeric' 
                })}
              </p>
            </div>
            <div className="flex items-center gap-4">
              <Link
                href="/dashboard/calendar"
                className="text-sm text-blue-600 hover:text-blue-700 font-medium"
              >
                Calendar
              </Link>
              <Link
                href="/dashboard/bookings"
                className="text-sm text-blue-600 hover:text-blue-700 font-medium"
              >
                Bookings
              </Link>
              <Link
                href="/dashboard/customers"
                className="text-sm text-blue-600 hover:text-blue-700 font-medium"
              >
                Customers
              </Link>
              <a
                href="https://t.me/Bikesavvy_bot"
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 inline-flex items-center gap-2"
                title="Chat with Bike Savvy Assistant"
              >
                💬 Live Chat
              </a>
              <div className="h-6 w-px bg-gray-300"></div>
              <button className="text-sm bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700">
                New Booking
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <KpiCard
            title="Bookings Today"
            value={data.bookingsToday.toString()}
            trend={data.bookingsToday > 0 ? `${data.schedule.length} scheduled` : 'No bookings'}
            trendUp={data.bookingsToday > 0}
          />
          <KpiCard
            title="Instructors Working"
            value={data.instructorsWorking.toString()}
            subtitle={data.instructorsWorking > 0 ? 'Active today' : 'None scheduled'}
          />
          <KpiCard
            title="Expected Revenue"
            value={`R${data.expectedRevenue.toLocaleString()}`}
            trend={`${data.pendingPayments} pending payment`}
          />
          <KpiCard
            title="Pending Payments"
            value={data.pendingPayments.toString()}
            severity={data.pendingPayments > 0 ? 'warning' : undefined}
            onClick={() => {}}
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Schedule */}
          <div className="lg:col-span-2 bg-white rounded-lg shadow">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-gray-900">Today's Schedule</h2>
                <Link
                  href="/dashboard/calendar"
                  className="text-sm text-blue-600 hover:text-blue-700"
                >
                  View Calendar →
                </Link>
              </div>
            </div>
            <div className="p-6">
              {data.schedule.length === 0 ? (
                <div className="text-center py-12">
                  <p className="text-gray-500">No bookings for today</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {data.schedule.map((booking) => (
                    <div
                      key={booking.id}
                      className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                    >
                      <div className="flex items-center gap-4">
                        <div className="text-center min-w-[60px]">
                          <p className="text-lg font-semibold text-gray-900">{booking.time}</p>
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">{booking.customer}</p>
                          <p className="text-sm text-gray-500">{booking.course}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-sm text-gray-600">{booking.instructor}</span>
                        <StatusBadge status={booking.status} />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Issues & Actions */}
          <div className="space-y-6">
            {/* Issue Centre */}
            <div className="bg-white rounded-lg shadow">
              <div className="p-6 border-b border-gray-200">
                <h2 className="text-lg font-semibold text-gray-900">Issue Centre</h2>
              </div>
              <div className="p-6">
                {data.issues.length === 0 ? (
                  <p className="text-gray-500 text-sm">No issues</p>
                ) : (
                  <div className="space-y-3">
                    {data.issues.map((issue) => (
                      <div
                        key={issue.id}
                        className={`p-3 rounded-lg border-l-4 ${
                          issue.severity === 'high'
                            ? 'bg-red-50 border-red-500'
                            : issue.severity === 'medium'
                            ? 'bg-yellow-50 border-yellow-500'
                            : 'bg-blue-50 border-blue-500'
                        }`}
                      >
                        <p className="text-sm text-gray-900">{issue.message}</p>
                        <button className="text-xs text-blue-600 hover:text-blue-700 mt-1 font-medium">
                          Resolve
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Quick Actions */}
            <div className="bg-white rounded-lg shadow">
              <div className="p-6 border-b border-gray-200">
                <h2 className="text-lg font-semibold text-gray-900">Quick Actions</h2>
              </div>
              <div className="p-6 space-y-3">
                <button className="w-full text-left px-4 py-3 bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 transition-colors font-medium">
                  + New Booking
                </button>
                <button className="w-full text-left px-4 py-3 bg-gray-50 text-gray-700 rounded-lg hover:bg-gray-100 transition-colors font-medium">
                  ⏸ Block Time
                </button>
                <button className="w-full text-left px-4 py-3 bg-gray-50 text-gray-700 rounded-lg hover:bg-gray-100 transition-colors font-medium">
                  👤 Add Customer
                </button>
                <button className="w-full text-left px-4 py-3 bg-gray-50 text-gray-700 rounded-lg hover:bg-gray-100 transition-colors font-medium">
                  💳 Record Payment
                </button>
                <button className="w-full text-left px-4 py-3 bg-gray-50 text-gray-700 rounded-lg hover:bg-gray-100 transition-colors font-medium">
                  📧 Message Customers
                </button>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

function KpiCard({
  title,
  value,
  subtitle,
  trend,
  trendUp,
  severity,
  onClick,
}: {
  title: string;
  value: string;
  subtitle?: string;
  trend?: string;
  trendUp?: boolean;
  severity?: 'warning' | 'error';
  onClick?: () => void;
}) {
  return (
    <div
      onClick={onClick}
      className={`bg-white rounded-lg shadow p-6 ${onClick ? 'cursor-pointer hover:shadow-md transition-shadow' : ''}`}
    >
      <h3 className="text-sm font-medium text-gray-500">{title}</h3>
      <p className={`text-3xl font-bold mt-2 ${
        severity === 'error' ? 'text-red-600' :
        severity === 'warning' ? 'text-yellow-600' :
        'text-gray-900'
      }`}>
        {value}
      </p>
      {subtitle && <p className="text-sm text-gray-500 mt-1">{subtitle}</p>}
      {trend && (
        <p className={`text-sm mt-2 ${trendUp ? 'text-green-600' : 'text-gray-500'}`}>
          {trend}
        </p>
      )}
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    confirmed: 'bg-green-100 text-green-700',
    pending_payment: 'bg-yellow-100 text-yellow-700',
    checked_in: 'bg-blue-100 text-blue-700',
    completed: 'bg-gray-100 text-gray-700',
    cancelled: 'bg-red-100 text-red-700',
  };

  const labels: Record<string, string> = {
    confirmed: 'Confirmed',
    pending_payment: 'Pending Payment',
    checked_in: 'Checked In',
    completed: 'Completed',
    cancelled: 'Cancelled',
  };

  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${styles[status] || styles.confirmed}`}>
      {labels[status] || status}
    </span>
  );
}

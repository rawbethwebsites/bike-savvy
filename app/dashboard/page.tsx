'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import LiveChatButton from '@/app/components/LiveChatButton';
import {
  formatDashboardDate,
  formatRand,
  humanizeDashboardStatus,
} from '@/lib/dashboard-home';

interface DashboardData {
  bookingsToday: number;
  instructorsWorking: number;
  expectedRevenue: number;
  pendingPayments: number;
  bookingsThisWeek: number;
  revenueThisWeek: number;
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

const statusStyles: Record<string, string> = {
  confirmed: 'border-[#75d69c]/25 bg-[#75d69c]/10 text-[#9ce6b8]',
  pending_payment: 'border-[#f4c95d]/25 bg-[#f4c95d]/10 text-[#f4d77d]',
  checked_in: 'border-[#8ab4f8]/25 bg-[#8ab4f8]/10 text-[#a9c9ff]',
  completed: 'border-white/10 bg-white/5 text-[#bdc3bd]',
  cancelled: 'border-[#ff7b72]/25 bg-[#ff7b72]/10 text-[#ff9d96]',
};

export default function TodayDashboard() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  async function fetchDashboard() {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/dashboard', { cache: 'no-store' });
      const payload = (await response.json()) as DashboardData & { error?: string };
      if (!response.ok) throw new Error(payload.error ?? 'Unable to load dashboard data.');
      setData(payload);
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : 'Unable to load dashboard data.');
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    const timer = window.setTimeout(() => void fetchDashboard(), 0);
    return () => window.clearTimeout(timer);
  }, []);

  if (isLoading) return <DashboardSkeleton />;

  if (error || !data) {
    return (
      <div className="min-h-[calc(100dvh-4rem)] bg-[#0b0d0c] p-4 sm:p-6 lg:p-8">
        <div className="mx-auto flex min-h-[55dvh] max-w-7xl items-center justify-center">
          <div className="w-full max-w-md rounded-xl border border-[#ff7b72]/25 bg-[#191c19] p-6 text-center">
            <ErrorIcon />
            <h1 className="mt-4 text-xl font-semibold text-[#f4f6f2]">Dashboard unavailable</h1>
            <p className="mt-2 text-sm leading-6 text-[#9ba39b]">{error ?? 'The dashboard could not be loaded.'}</p>
            <button
              type="button"
              onClick={() => void fetchDashboard()}
              className="mt-5 min-h-11 rounded-lg bg-[#A8C45A] px-5 text-sm font-semibold text-[#0b0d0c] hover:bg-[#BDD579] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#A8C45A] focus-visible:ring-offset-2 focus-visible:ring-offset-[#191c19]"
            >
              Try again
            </button>
          </div>
        </div>
      </div>
    );
  }

  const nextBooking = data.schedule[0];

  return (
    <div className="min-h-[calc(100dvh-4rem)] overflow-x-hidden bg-[#0b0d0c] px-4 py-6 text-[#f4f6f2] sm:px-6 lg:px-8 lg:py-8">
      <LiveChatButton />
      <div className="mx-auto max-w-[1440px]">
        <header className="mb-6 flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-[#9ba39b]">
              {formatDashboardDate(new Date())}
            </p>
            <h1 className="mt-1 text-[28px] font-semibold tracking-[-0.035em] text-[#f4f6f2]">
              Today&apos;s operations
            </h1>
            <p className="mt-1 text-sm text-[#9ba39b]">Priorities, lessons and revenue in one live view.</p>
          </div>
          <div className="grid grid-cols-1 gap-2 min-[480px]:grid-cols-2 sm:flex">
            <Link href="/dashboard/calendar" className="inline-flex min-h-11 items-center justify-center rounded-lg border border-white/10 bg-[#191c19] px-4 text-sm font-semibold text-[#d7dcd7] transition-colors hover:bg-[#222622] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#A8C45A]">
              View calendar
            </Link>
            <Link href="/dashboard/bookings" className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg bg-[#A8C45A] px-4 text-sm font-semibold text-[#0b0d0c] transition-colors hover:bg-[#BDD579] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#A8C45A] focus-visible:ring-offset-2 focus-visible:ring-offset-[#0b0d0c]">
              <PlusIcon />
              Bookings
            </Link>
          </div>
        </header>

        <section aria-label="Operational metrics" className="mb-4 grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <MetricCard href="/dashboard/calendar" label="Bookings today" value={String(data.bookingsToday)} note={nextBooking ? `Next at ${nextBooking.time}` : 'No lessons scheduled'} tone="lime" />
          <MetricCard href="/dashboard/bookings" label="Bookings this week" value={String(data.bookingsThisWeek)} note={`${formatRand(data.revenueThisWeek)} expected`} tone="blue" />
          <MetricCard href="/dashboard/bookings" label="Awaiting payment" value={String(data.pendingPayments)} note={data.pendingPayments ? 'Needs follow-up' : 'Nothing outstanding today'} tone={data.pendingPayments ? 'yellow' : 'green'} />
          <MetricCard href="/dashboard/bookings" label="Expected today" value={formatRand(data.expectedRevenue)} note={`${data.instructorsWorking} instructor${data.instructorsWorking === 1 ? '' : 's'} working`} tone="green" />
        </section>

        <section className="mb-4 grid grid-cols-1 gap-4 xl:grid-cols-12">
          <article className="overflow-hidden rounded-xl border border-white/10 bg-[#191c19] xl:col-span-7">
            <PanelHeader title="Attention queue" description="Operational blockers that need a response" count={data.issues.length} />
            {data.issues.length === 0 ? (
              <div className="flex min-h-56 flex-col items-center justify-center px-6 py-10 text-center">
                <span className="grid h-11 w-11 place-items-center rounded-full border border-[#75d69c]/25 bg-[#75d69c]/10 text-[#75d69c]"><CheckIcon /></span>
                <h2 className="mt-4 text-base font-semibold">All caught up</h2>
                <p className="mt-1 max-w-sm text-sm text-[#9ba39b]">No payment or schedule issues require attention right now.</p>
                {nextBooking && <p className="mt-4 text-xs font-medium text-[#cbd1cb]">Next lesson: {nextBooking.time} · {nextBooking.customer}</p>}
              </div>
            ) : (
              <div className="divide-y divide-white/10 p-2">
                {data.issues.map((issue) => (
                  <Link key={issue.id} href="/dashboard/bookings" className="group grid min-h-[88px] grid-cols-[8px_minmax(0,1fr)_auto] items-center gap-3 rounded-lg px-3 py-3 transition-colors hover:bg-[#222622] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#A8C45A] sm:gap-4">
                    <span className={`h-9 w-2 rounded-full ${issue.severity === 'high' ? 'bg-[#ff7b72]' : issue.severity === 'medium' ? 'bg-[#f4c95d]' : 'bg-[#8ab4f8]'}`} />
                    <span className="min-w-0">
                      <span className="block text-sm font-semibold text-[#eef1ee]">{issue.message}</span>
                      <span className="mt-1 block text-xs text-[#9ba39b]">{issue.type === 'payment' ? 'Payment follow-up required' : 'Review this booking'}</span>
                    </span>
                    <span className="hidden min-h-9 items-center rounded-md border border-white/10 bg-[#222622] px-3 text-xs font-semibold text-[#d7dcd7] group-hover:border-white/20 sm:inline-flex">Review</span>
                  </Link>
                ))}
              </div>
            )}
          </article>

          <article className="overflow-hidden rounded-xl border border-white/10 bg-[#191c19] xl:col-span-5">
            <PanelHeader title="Today&apos;s timeline" description="Africa/Johannesburg" action={{ href: '/dashboard/calendar', label: 'Full calendar' }} />
            {data.schedule.length === 0 ? (
              <div className="flex min-h-56 flex-col items-center justify-center px-6 py-10 text-center">
                <CalendarIcon />
                <h2 className="mt-4 text-base font-semibold">No lessons today</h2>
                <p className="mt-1 text-sm text-[#9ba39b]">The calendar is clear for the rest of the day.</p>
              </div>
            ) : (
              <div className="px-4 py-2 sm:px-5">
                {data.schedule.map((booking, index) => (
                  <Link key={booking.id} href="/dashboard/bookings" className="group relative grid min-h-[82px] grid-cols-[52px_minmax(0,1fr)] gap-3 py-4 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#A8C45A]">
                    {index < data.schedule.length - 1 && <span className="absolute bottom-0 left-[27px] top-[47px] w-px bg-white/10" />}
                    <span className="relative pt-0.5 text-xs font-semibold tabular-nums text-[#e4e8e4]">
                      {booking.time}
                      <span className="absolute right-0 top-1.5 h-2 w-2 rounded-full bg-[#A8C45A] shadow-[0_0_0_4px_#191c19]" />
                    </span>
                    <span className="min-w-0 pl-1">
                      <span className="flex flex-wrap items-start justify-between gap-2">
                        <span className="min-w-0">
                          <span className="block truncate text-sm font-semibold text-[#eef1ee] group-hover:text-white">{booking.customer}</span>
                          <span className="mt-0.5 block truncate text-xs text-[#9ba39b]">{booking.course} · {booking.instructor}</span>
                        </span>
                        <StatusBadge status={booking.status} />
                      </span>
                    </span>
                  </Link>
                ))}
              </div>
            )}
          </article>
        </section>

        <section className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          <article className="overflow-hidden rounded-xl border border-white/10 bg-[#191c19]">
            <PanelHeader title="Weekly outlook" description="Confirmed and active training" action={{ href: '/dashboard/bookings', label: 'View bookings' }} />
            <div className="grid grid-cols-2 divide-x divide-white/10 p-5 sm:p-6">
              <div className="pr-5">
                <p className="text-xs font-medium text-[#9ba39b]">Sessions</p>
                <p className="mt-2 text-3xl font-semibold tracking-[-0.04em] tabular-nums">{data.bookingsThisWeek}</p>
                <p className="mt-1 text-xs text-[#788078]">Monday–Sunday</p>
              </div>
              <div className="pl-5">
                <p className="text-xs font-medium text-[#9ba39b]">Expected revenue</p>
                <p className="mt-2 text-3xl font-semibold tracking-[-0.04em] tabular-nums">{formatRand(data.revenueThisWeek)}</p>
                <p className="mt-1 text-xs text-[#788078]">Active bookings</p>
              </div>
            </div>
          </article>

          <article className="overflow-hidden rounded-xl border border-white/10 bg-[#191c19]">
            <PanelHeader title="Working actions" description="Every action opens a functioning workspace" />
            <div className="grid grid-cols-1 gap-2 p-4 sm:grid-cols-3">
              <ActionLink href="/dashboard/calendar" label="Review schedule" icon={<CalendarIcon />} />
              <ActionLink href="/dashboard/bookings" label="Manage bookings" icon={<BookingsIcon />} />
              <ActionLink href="/dashboard/customers" label="Customer records" icon={<CustomersIcon />} />
            </div>
          </article>
        </section>
      </div>
    </div>
  );
}

function MetricCard({ href, label, value, note, tone }: { href: string; label: string; value: string; note: string; tone: 'lime' | 'blue' | 'yellow' | 'green' }) {
  const tones = { lime: 'bg-[#A8C45A]', blue: 'bg-[#8ab4f8]', yellow: 'bg-[#f4c95d]', green: 'bg-[#75d69c]' };
  return (
    <Link href={href} className="group relative min-h-[132px] overflow-hidden rounded-xl border border-white/10 bg-[#191c19] p-5 transition-colors hover:bg-[#222622] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#A8C45A]">
      <span className="flex items-center justify-between text-xs font-medium text-[#9ba39b]"><span>{label}</span><ArrowIcon /></span>
      <span className="mt-4 block text-3xl font-semibold tracking-[-0.04em] tabular-nums text-[#f4f6f2]">{value}</span>
      <span className="mt-1 block text-xs text-[#9ba39b]">{note}</span>
      <span className={`absolute inset-x-0 bottom-0 h-0.5 ${tones[tone]}`} />
    </Link>
  );
}

function PanelHeader({ title, description, count, action }: { title: string; description: string; count?: number; action?: { href: string; label: string } }) {
  return (
    <div className="flex min-h-[66px] items-center justify-between gap-4 border-b border-white/10 px-5">
      <div><h2 className="text-base font-semibold text-[#eef1ee]">{title}</h2><p className="mt-0.5 text-xs text-[#9ba39b]">{description}</p></div>
      {typeof count === 'number' && <span className={`grid h-7 min-w-7 place-items-center rounded-full px-2 text-xs font-bold ${count ? 'bg-[#f4c95d]/10 text-[#f4d77d]' : 'bg-white/5 text-[#9ba39b]'}`}>{count}</span>}
      {action && <Link href={action.href} className="inline-flex min-h-11 items-center text-xs font-semibold text-[#A8C45A] hover:text-[#BDD579] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#A8C45A]">{action.label}</Link>}
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  return <span className={`inline-flex min-h-6 items-center rounded-full border px-2 text-[10px] font-semibold ${statusStyles[status] ?? statusStyles.completed}`}>{humanizeDashboardStatus(status)}</span>;
}

function ActionLink({ href, label, icon }: { href: string; label: string; icon: React.ReactNode }) {
  return <Link href={href} className="flex min-h-14 items-center gap-3 rounded-lg border border-white/10 bg-[#222622] px-3 text-sm font-semibold text-[#d7dcd7] transition-colors hover:border-white/20 hover:bg-[#292e29] hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#A8C45A]"><span className="h-5 w-5 text-[#A8C45A] [&>svg]:h-5 [&>svg]:w-5">{icon}</span>{label}</Link>;
}

function DashboardSkeleton() {
  return <div aria-label="Loading dashboard" aria-live="polite" className="min-h-[calc(100dvh-4rem)] bg-[#0b0d0c] p-4 sm:p-6 lg:p-8"><div className="mx-auto max-w-[1440px] animate-pulse"><div className="h-20 max-w-md rounded-lg bg-[#191c19]" /><div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">{Array.from({ length: 4 }).map((_, index) => <div key={index} className="h-[132px] rounded-xl border border-white/5 bg-[#191c19]" />)}</div><div className="mt-4 grid gap-4 xl:grid-cols-2"><div className="h-80 rounded-xl border border-white/5 bg-[#191c19]" /><div className="h-80 rounded-xl border border-white/5 bg-[#191c19]" /></div><span className="sr-only">Loading dashboard data</span></div></div>;
}

function PlusIcon() { return <svg aria-hidden="true" viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 5v14M5 12h14" /></svg>; }
function ArrowIcon() { return <svg aria-hidden="true" viewBox="0 0 24 24" className="h-4 w-4 transition-transform group-hover:translate-x-0.5" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M5 12h14M13 6l6 6-6 6" /></svg>; }
function CheckIcon() { return <svg aria-hidden="true" viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2"><path d="m5 12 4 4L19 6" /></svg>; }
function ErrorIcon() { return <svg aria-hidden="true" viewBox="0 0 24 24" className="mx-auto h-9 w-9 text-[#ff7b72]" fill="none" stroke="currentColor" strokeWidth="1.8"><circle cx="12" cy="12" r="9" /><path d="M12 7v6M12 17h.01" /></svg>; }
function CalendarIcon() { return <svg aria-hidden="true" viewBox="0 0 24 24" className="h-6 w-6 text-[#8ab4f8]" fill="none" stroke="currentColor" strokeWidth="1.8"><rect x="3" y="5" width="18" height="16" rx="2" /><path d="M8 3v4M16 3v4M3 10h18" /></svg>; }
function BookingsIcon() { return <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M6 3h12v18H6zM9 8h6M9 12h6M9 16h4" /></svg>; }
function CustomersIcon() { return <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><circle cx="9" cy="8" r="3" /><path d="M3.5 20v-2a5.5 5.5 0 0 1 11 0v2M16 5.5a3 3 0 0 1 0 5.8M17 14a5 5 0 0 1 3.5 4.8V20" /></svg>; }

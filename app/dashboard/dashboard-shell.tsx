'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import {
  dashboardNavigation,
  isDashboardPathActive,
  type DashboardNavigationItem,
} from '@/lib/dashboard-navigation';

const icons: Record<DashboardNavigationItem['icon'], React.ReactNode> = {
  dashboard: (
    <svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="1.8">
      <rect x="3" y="3" width="7" height="7" rx="1" />
      <rect x="14" y="3" width="7" height="7" rx="1" />
      <rect x="3" y="14" width="7" height="7" rx="1" />
      <rect x="14" y="14" width="7" height="7" rx="1" />
    </svg>
  ),
  calendar: (
    <svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="1.8">
      <rect x="3" y="5" width="18" height="16" rx="2" />
      <path d="M8 3v4M16 3v4M3 10h18" />
    </svg>
  ),
  bookings: (
    <svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="1.8">
      <path d="M6 3h12v18H6zM9 8h6M9 12h6M9 16h4" />
    </svg>
  ),
  customers: (
    <svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="1.8">
      <circle cx="9" cy="8" r="3" />
      <path d="M3.5 20v-2a5.5 5.5 0 0 1 11 0v2M16 5.5a3 3 0 0 1 0 5.8M17 14a5 5 0 0 1 3.5 4.8V20" />
    </svg>
  ),
};

export default function DashboardShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    function closeOnEscape(event: KeyboardEvent) {
      if (event.key === 'Escape') setMenuOpen(false);
    }
    window.addEventListener('keydown', closeOnEscape);
    return () => window.removeEventListener('keydown', closeOnEscape);
  }, []);

  return (
    <div className="min-h-dvh bg-gray-50 text-gray-950">
      <header className="fixed inset-x-0 top-0 z-50 flex h-16 items-center border-b border-gray-200 bg-white px-4 md:px-6">
        <button
          type="button"
          aria-label={menuOpen ? 'Close navigation menu' : 'Open navigation menu'}
          aria-expanded={menuOpen}
          aria-controls="dashboard-navigation"
          onClick={() => setMenuOpen((open) => !open)}
          className="mr-3 grid h-11 w-11 place-items-center rounded-lg text-gray-700 transition-colors hover:bg-gray-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gray-950 md:hidden"
        >
          {menuOpen ? (
            <svg viewBox="0 0 24 24" aria-hidden="true" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M6 6l12 12M18 6L6 18" />
            </svg>
          ) : (
            <svg viewBox="0 0 24 24" aria-hidden="true" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M4 7h16M4 12h16M4 17h16" />
            </svg>
          )}
        </button>

        <Link href="/dashboard" className="flex items-center gap-3" aria-label="Bike Savvy dashboard home">
          <span className="grid h-9 w-9 place-items-center bg-[#c9ff32] text-xs font-black tracking-[-0.04em] text-[#0b0d0c]">BS</span>
          <span>
            <span className="block text-sm font-bold leading-tight">Bike Savvy</span>
            <span className="block text-[10px] font-semibold uppercase tracking-[0.16em] text-gray-500">Operations</span>
          </span>
        </Link>

        <div className="ml-auto flex items-center gap-2">
          <a
            href="/"
            target="_blank"
            rel="noopener noreferrer"
            className="hidden min-h-11 items-center rounded-lg px-3 text-sm font-medium text-gray-600 transition-colors hover:bg-gray-100 hover:text-gray-950 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gray-950 sm:inline-flex"
          >
            View website
          </a>
          <Link
            href="/dashboard/bookings"
            className="inline-flex min-h-11 items-center rounded-lg bg-gray-950 px-4 text-sm font-semibold text-white transition-colors hover:bg-gray-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gray-950 focus-visible:ring-offset-2"
          >
            New booking
          </Link>
        </div>
      </header>

      {menuOpen && (
        <button
          type="button"
          aria-label="Close navigation menu"
          onClick={() => setMenuOpen(false)}
          className="fixed inset-0 z-30 bg-black/55 md:hidden"
        />
      )}

      <aside
        id="dashboard-navigation"
        className={`fixed bottom-0 left-0 top-16 z-40 flex w-64 flex-col border-r border-white/10 bg-[#111311] text-white transition-transform duration-200 ease-out md:translate-x-0 ${
          menuOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <nav aria-label="Dashboard navigation" className="space-y-1 p-4">
          {dashboardNavigation.map((item) => {
            const active = isDashboardPathActive(pathname, item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={active ? 'page' : undefined}
                onClick={() => setMenuOpen(false)}
                className={`flex min-h-12 items-center gap-3 rounded-lg px-3 text-sm font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#c9ff32] ${
                  active
                    ? 'bg-[#c9ff32] text-[#0b0d0c]'
                    : 'text-gray-300 hover:bg-white/10 hover:text-white'
                }`}
              >
                <span className="h-5 w-5 shrink-0">{icons[item.icon]}</span>
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="mt-auto border-t border-white/10 p-4">
          <a
            href="https://t.me/Bikesavvy_bot"
            target="_blank"
            rel="noopener noreferrer"
            className="flex min-h-12 items-center gap-3 rounded-lg px-3 text-sm font-medium text-gray-300 transition-colors hover:bg-white/10 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#c9ff32]"
          >
            <svg viewBox="0 0 24 24" aria-hidden="true" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8">
              <path d="M21 4L3.8 10.6c-1.2.5-1.2 1.1-.2 1.4l4.4 1.4 1.7 5.2c.2.7.1 1 .8 1 .5 0 .8-.2 1-.4l2.1-2 4.4 3.2c.8.4 1.4.2 1.6-.8L22.4 6c.3-1.1-.4-1.6-1.4-1.2Z" />
            </svg>
            Telegram support
          </a>
        </div>
      </aside>

      <main className="min-h-dvh pt-16 md:pl-64">{children}</main>
    </div>
  );
}

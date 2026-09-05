'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import {
  dashboardNavigation,
  getDashboardPageTitle,
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
  const pageTitle = getDashboardPageTitle(pathname);

  useEffect(() => {
    function closeOnEscape(event: KeyboardEvent) {
      if (event.key === 'Escape') setMenuOpen(false);
    }

    document.body.style.overflow = menuOpen ? 'hidden' : '';
    window.addEventListener('keydown', closeOnEscape);

    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', closeOnEscape);
    };
  }, [menuOpen]);

  return (
    <div className="dashboard-shell min-h-dvh bg-[#0b0d0c] text-[#f4f6f2]">
      <a
        href="#dashboard-content"
        className="fixed left-4 top-3 z-[70] -translate-y-20 rounded-md bg-[#A8C45A] px-4 py-2 font-semibold text-[#0b0d0c] transition-transform focus:translate-y-0"
      >
        Skip to content
      </a>

      <header className="fixed inset-x-0 top-0 z-50 flex h-16 items-center border-b border-white/10 bg-[#111311] px-4 text-[#f4f6f2] md:px-6">
        <button
          type="button"
          aria-label={menuOpen ? 'Close navigation menu' : 'Open navigation menu'}
          aria-expanded={menuOpen}
          aria-controls="dashboard-navigation"
          onClick={() => setMenuOpen((open) => !open)}
          className="mr-3 grid h-11 w-11 shrink-0 place-items-center rounded-lg text-[#d4d9d4] transition-colors hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#A8C45A] md:hidden"
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

        <Link href="/dashboard" className="flex min-h-11 items-center gap-3" aria-label="Bike Savvy dashboard home">
          <span className="grid h-9 w-9 place-items-center bg-[#A8C45A] text-xs font-black tracking-[-0.04em] text-[#0b0d0c]">BS</span>
          <span className="hidden sm:block">
            <span className="block text-sm font-bold leading-tight">Bike Savvy</span>
            <span className="block text-[10px] font-semibold uppercase tracking-[0.16em] text-[#9ba39b]">Operations</span>
          </span>
        </Link>

        <div className="ml-4 hidden h-6 w-px bg-white/10 sm:block" />
        <span className="ml-4 truncate text-sm font-medium text-[#cdd2cd]">{pageTitle}</span>

        <div className="ml-auto flex items-center gap-2">
          <a
            href="/"
            target="_blank"
            rel="noopener noreferrer"
            className="hidden min-h-11 items-center rounded-lg px-3 text-sm font-medium text-[#9ba39b] transition-colors hover:bg-white/10 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#A8C45A] sm:inline-flex"
          >
            View website
          </a>
          <Link
            href="/dashboard/bookings"
            className="hidden min-h-11 items-center rounded-lg bg-[#A8C45A] px-4 text-sm font-semibold text-[#0b0d0c] transition-colors hover:bg-[#BDD579] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#A8C45A] focus-visible:ring-offset-2 focus-visible:ring-offset-[#111311] sm:inline-flex"
          >
            Bookings
          </Link>
        </div>
      </header>

      {menuOpen && (
        <button
          type="button"
          aria-label="Close navigation menu"
          onClick={() => setMenuOpen(false)}
          className="fixed inset-0 top-16 z-30 bg-black/65 md:hidden"
        />
      )}

      <aside
        id="dashboard-navigation"
        className={`fixed bottom-0 left-0 top-16 z-40 flex w-64 flex-col border-r border-white/10 bg-[#111311] text-white transition-transform duration-200 ease-out md:translate-x-0 ${
          menuOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="px-4 pb-2 pt-5 text-[10px] font-bold uppercase tracking-[0.16em] text-[#727a72]">Workspace</div>
        <nav aria-label="Dashboard navigation" className="space-y-1 px-3">
          {dashboardNavigation.map((item) => {
            const active = isDashboardPathActive(pathname, item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={active ? 'page' : undefined}
                onClick={() => setMenuOpen(false)}
                className={`flex min-h-12 items-center gap-3 rounded-lg px-3 text-sm font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#A8C45A] ${
                  active
                    ? 'bg-[#A8C45A] text-[#0b0d0c]'
                    : 'text-[#bdc3bd] hover:bg-white/10 hover:text-white'
                }`}
              >
                <span className="h-5 w-5 shrink-0">{icons[item.icon]}</span>
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="mt-auto border-t border-white/10 p-3">
          <a
            href="https://t.me/Bikesavvy_bot"
            target="_blank"
            rel="noopener noreferrer"
            className="flex min-h-12 items-center gap-3 rounded-lg px-3 text-sm font-medium text-[#bdc3bd] transition-colors hover:bg-white/10 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#A8C45A]"
          >
            <svg viewBox="0 0 24 24" aria-hidden="true" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8">
              <path d="M21 4L3.8 10.6c-1.2.5-1.2 1.1-.2 1.4l4.4 1.4 1.7 5.2c.2.7.1 1 .8 1 .5 0 .8-.2 1-.4l2.1-2 4.4 3.2c.8.4 1.4.2 1.6-.8L22.4 6c.3-1.1-.4-1.6-1.4-1.2Z" />
            </svg>
            Telegram support
          </a>
          <div className="mt-2 flex min-h-10 items-center px-3 text-xs text-[#8f978f]">
            <span className="mr-2 h-2 w-2 rounded-full bg-[#75d69c] shadow-[0_0_0_3px_rgba(117,214,156,0.12)]" />
            Operations online
          </div>
        </div>
      </aside>

      <main id="dashboard-content" tabIndex={-1} className="min-h-dvh bg-[#0b0d0c] pt-16 outline-none md:pl-64">
        {children}
      </main>
    </div>
  );
}

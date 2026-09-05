import { describe, expect, it } from 'vitest';
import {
  dashboardNavigation,
  getDashboardPageTitle,
  isDashboardPathActive,
} from './dashboard-navigation';

describe('dashboardNavigation', () => {
  it('exposes every working dashboard destination', () => {
    expect(dashboardNavigation.map((item) => item.href)).toEqual([
      '/dashboard',
      '/dashboard/calendar',
      '/dashboard/bookings',
      '/dashboard/customers',
    ]);
  });

  it('marks the dashboard root exactly and nested sections by prefix', () => {
    expect(isDashboardPathActive('/dashboard', '/dashboard')).toBe(true);
    expect(isDashboardPathActive('/dashboard/calendar', '/dashboard')).toBe(false);
    expect(
      isDashboardPathActive('/dashboard/customers/123', '/dashboard/customers'),
    ).toBe(true);
  });

  it('provides a stable page title for the responsive shell', () => {
    expect(getDashboardPageTitle('/dashboard')).toBe('Today');
    expect(getDashboardPageTitle('/dashboard/calendar')).toBe('Calendar');
    expect(getDashboardPageTitle('/dashboard/bookings/123')).toBe('Bookings');
    expect(getDashboardPageTitle('/dashboard/unknown')).toBe('Operations');
  });
});

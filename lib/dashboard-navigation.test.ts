import { describe, expect, it } from 'vitest';
import { dashboardNavigation, isDashboardPathActive } from './dashboard-navigation';

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
});

import { describe, expect, it } from 'vitest';
import { summarizeWeeklyBookings } from './dashboard-metrics';

describe('dashboard metrics', () => {
  it('keeps weekly totals when today has no bookings', () => {
    expect(
      summarizeWeeklyBookings([
        { price_cents: 85000 },
        { price_cents: 120000 },
      ]),
    ).toEqual({ bookingsThisWeek: 2, revenueThisWeek: 2050 });
  });

  it('treats missing prices as zero without dropping the booking', () => {
    expect(summarizeWeeklyBookings([{ price_cents: null }])).toEqual({
      bookingsThisWeek: 1,
      revenueThisWeek: 0,
    });
  });
});

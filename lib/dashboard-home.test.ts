import { describe, expect, it } from 'vitest';
import {
  formatDashboardDate,
  formatRand,
  humanizeDashboardStatus,
} from './dashboard-home';

describe('dashboard homepage presentation', () => {
  it('formats operational money as whole South African rand', () => {
    expect(formatRand(6200)).toBe('R6,200');
    expect(formatRand(0)).toBe('R0');
  });

  it('turns stored status values into readable labels', () => {
    expect(humanizeDashboardStatus('pending_payment')).toBe('Pending payment');
    expect(humanizeDashboardStatus('checked_in')).toBe('Checked in');
  });

  it('uses the Johannesburg calendar day for the command header', () => {
    expect(formatDashboardDate(new Date('2026-09-04T23:30:00.000Z'))).toBe(
      'Saturday, 5 September 2026',
    );
  });
});

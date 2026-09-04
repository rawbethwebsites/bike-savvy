import { describe, expect, it } from 'vitest';
import {
  getSupabaseReadCredentials,
  isBookingInInstructorLane,
  toJohannesburgDateKey,
} from './calendar';

describe('getSupabaseReadCredentials', () => {
  it('uses the publishable key for calendar reads', () => {
    const credentials = getSupabaseReadCredentials({
      NEXT_PUBLIC_SUPABASE_URL: 'https://example.supabase.co',
      NEXT_PUBLIC_SUPABASE_ANON_KEY: 'publishable-key',
      SUPABASE_SERVICE_ROLE_KEY: 'stale-service-key',
    });

    expect(credentials).toEqual({
      url: 'https://example.supabase.co',
      key: 'publishable-key',
    });
  });

  it('fails clearly when the publishable credentials are missing', () => {
    expect(() => getSupabaseReadCredentials({})).toThrow(
      'Missing Supabase calendar environment variables',
    );
  });
});

describe('calendar lane matching', () => {
  it('places a booking only in its assigned instructor lane', () => {
    const booking = {
      start_time: '2026-09-04T09:00:00+02:00',
      instructor: { id: 'instructor-1', full_name: 'Daniel Mokoena' },
    };

    expect(
      isBookingInInstructorLane(booking, 'instructor-1', new Date('2026-09-04T12:00:00+02:00')),
    ).toBe(true);
    expect(
      isBookingInInstructorLane(booking, 'instructor-2', new Date('2026-09-04T12:00:00+02:00')),
    ).toBe(false);
  });

  it('uses the Johannesburg calendar date around midnight', () => {
    expect(toJohannesburgDateKey('2026-09-03T22:30:00.000Z')).toBe('2026-09-04');
  });
});

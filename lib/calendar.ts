export type CalendarBookingLane = {
  start_time: string;
  instructor: { id: string; full_name: string } | null;
};

type CalendarEnvironment = Record<string, string | undefined>;

export function getSupabaseReadCredentials(environment: CalendarEnvironment) {
  const url = environment.NEXT_PUBLIC_SUPABASE_URL;
  const key = environment.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !key) {
    throw new Error('Missing Supabase calendar environment variables');
  }

  return { url, key };
}

const johannesburgDateFormatter = new Intl.DateTimeFormat('en-CA', {
  timeZone: 'Africa/Johannesburg',
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
});

export function toJohannesburgDateKey(value: string | Date) {
  return johannesburgDateFormatter.format(
    typeof value === 'string' ? new Date(value) : value,
  );
}

export function isBookingInInstructorLane(
  booking: CalendarBookingLane,
  instructorId: string,
  date: Date,
) {
  return (
    booking.instructor?.id === instructorId &&
    toJohannesburgDateKey(booking.start_time) === toJohannesburgDateKey(date)
  );
}

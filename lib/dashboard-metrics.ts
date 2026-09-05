type BookingPrice = { price_cents: number | null };

export function summarizeWeeklyBookings(bookings: BookingPrice[]) {
  return {
    bookingsThisWeek: bookings.length,
    revenueThisWeek: Math.floor(
      bookings.reduce((total, booking) => total + (booking.price_cents ?? 0), 0) / 100,
    ),
  };
}

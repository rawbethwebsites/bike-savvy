export type BookingNotification = {
  bookingNumber: string;
  firstName: string;
  lastName: string;
  phone: string;
  email?: string;
  courseName: string;
  startTime: Date;
  durationMinutes: number;
  priceCents: number;
  depositCents: number;
  ridingLevel: string;
  hasOwnMotorcycle: boolean;
  notes?: string;
};

type SendResult =
  | { sent: true }
  | { sent: false; reason: 'not_configured' };

function escapeHtml(value: string) {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function formatCapeTownDate(date: Date) {
  const parts = new Intl.DateTimeFormat('en-GB', {
    timeZone: 'Africa/Johannesburg',
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).formatToParts(date);
  const value = (type: Intl.DateTimeFormatPartTypes) =>
    parts.find((part) => part.type === type)?.value ?? '';
  return `${value('day')} ${value('month')} ${value('year')}, ${value('hour')}:${value('minute')}`;
}

function formatRand(cents: number) {
  return `R${Math.round(cents / 100).toLocaleString('en-US')}`;
}

export function formatBookingNotification(booking: BookingNotification) {
  const lines = [
    '<b>🏍 New Bike Savvy booking request</b>',
    '',
    `<b>Reference:</b> ${escapeHtml(booking.bookingNumber)}`,
    `<b>Customer:</b> ${escapeHtml(`${booking.firstName} ${booking.lastName}`)}`,
    `<b>Phone:</b> ${escapeHtml(booking.phone)}`,
  ];

  if (booking.email) lines.push(`<b>Email:</b> ${escapeHtml(booking.email)}`);

  lines.push(
    `<b>Course:</b> ${escapeHtml(booking.courseName)}`,
    `<b>Date:</b> ${formatCapeTownDate(booking.startTime)} SAST`,
    `<b>Duration:</b> ${booking.durationMinutes} minutes`,
    `<b>Price:</b> ${formatRand(booking.priceCents)}`,
    `<b>Deposit:</b> ${formatRand(booking.depositCents)}`,
    `<b>Riding level:</b> ${escapeHtml(booking.ridingLevel)}`,
    `<b>Own motorcycle:</b> ${booking.hasOwnMotorcycle ? 'Yes' : 'No'}`,
  );

  if (booking.notes) lines.push(`<b>Notes:</b> ${escapeHtml(booking.notes)}`);

  lines.push('', '<i>Status: Draft — contact the customer to confirm.</i>');
  return lines.join('\n');
}

export async function sendBookingNotification(
  booking: BookingNotification,
): Promise<SendResult> {
  const token = process.env.TELEGRAM_BOT_TOKEN?.trim();
  const chatId = process.env.TELEGRAM_NOTIFICATION_CHAT_ID?.trim();

  if (!token || !chatId) return { sent: false, reason: 'not_configured' };

  const response = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      chat_id: chatId,
      text: formatBookingNotification(booking),
      parse_mode: 'HTML',
      disable_web_page_preview: true,
    }),
  });

  if (!response.ok) {
    const detail = await response.text();
    throw new Error(`Telegram notification failed (${response.status}): ${detail.slice(0, 300)}`);
  }

  return { sent: true };
}

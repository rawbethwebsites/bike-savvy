import { createClient } from '../../lib/supabase/server';
import type { Database } from '../../lib/booking/types';

type SendResult =
  | { sent: true }
  | { sent: false; reason: 'not_configured' };

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

function escapeHtml(value: string) {
  return value
    .replace(/&/g, '&')
    .replace(/</g, '<')
    .replace(/>/g, '>')
    .replace(/\"/g, '"')
    .replace(/'/g, "'");
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
  if (!token) return { sent: false, reason: 'not_configured' };

  const supabase = await createClient();
  const { data: accounts, error } = await supabase
    .from('telegram_accounts')
    .select('telegram_user_id');

  let chatIds: string[] = [];

  if (!error && accounts) {
    chatIds = accounts.map((acc) => (acc as { telegram_user_id: number }).telegram_user_id.toString());
  }

  // Add extra IDs from env var
  const extra = process.env.TELEGRAM_EXTRA_CHAT_IDS?.trim();
  if (extra) {
    const extraIds = extra
      .split(',')
      .map((id) => id.trim())
      .filter((id) => id.length > 0);
    chatIds = [...chatIds, ...extraIds];
  }

  // Fallback to single chat ID if none found
  if (chatIds.length === 0) {
    const chatId = process.env.TELEGRAM_NOTIFICATION_CHAT_ID?.trim();
    if (!chatId) return { sent: false, reason: 'not_configured' };
    chatIds.push(chatId);
  }

  // Send to all accounts; log errors but do not fail the booking
  await Promise.all(
    chatIds.map((chatId) =>
      sendToChat(token, chatId, booking).catch((err) => {
        console.error(`Failed to send Telegram notification to chatId ${chatId}:`, err);
      })
    )
  );

  // If we got here, we have token and at least one chatId, and we attempted to send.
  return { sent: true };
}

async function sendToChat(
  token: string,
  chatId: string,
  booking: BookingNotification,
): Promise<{ sent: true }> {
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
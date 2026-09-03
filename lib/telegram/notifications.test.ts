import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  formatBookingNotification,
  sendBookingNotification,
  type BookingNotification,
} from './notifications';

const booking: BookingNotification = {
  bookingNumber: 'WEB-2026-09-03-ABC12345',
  firstName: 'Robert',
  lastName: 'John',
  phone: '+27 81 234 5678',
  email: 'rob@example.com',
  courseName: 'Licence Test Preparation',
  startTime: new Date('2026-09-12T12:30:00.000Z'),
  durationMinutes: 180,
  priceCents: 150000,
  depositCents: 50000,
  ridingLevel: 'intermediate',
  hasOwnMotorcycle: true,
  notes: 'Please call first',
};

afterEach(() => {
  vi.unstubAllEnvs();
  vi.restoreAllMocks();
});

describe('formatBookingNotification', () => {
  it('formats a booking in Cape Town time with customer and payment details', () => {
    const message = formatBookingNotification(booking);

    expect(message).toContain('New Bike Savvy booking request');
    expect(message).toContain('WEB-2026-09-03-ABC12345');
    expect(message).toContain('Robert John');
    expect(message).toContain('12 Sept 2026, 14:30');
    expect(message).toContain('R1,500');
    expect(message).toContain('R500');
    expect(message).toContain('Own motorcycle:</b> Yes');
  });

  it('escapes Telegram HTML in customer-provided fields', () => {
    const message = formatBookingNotification({ ...booking, notes: '<b>urgent & important</b>' });

    expect(message).toContain('&lt;b&gt;urgent &amp; important&lt;/b&gt;');
    expect(message).not.toContain('<b>urgent & important</b>');
  });
});

describe('sendBookingNotification', () => {
  it('skips cleanly when Telegram is not configured', async () => {
    vi.stubEnv('TELEGRAM_BOT_TOKEN', '');
    vi.stubEnv('TELEGRAM_NOTIFICATION_CHAT_ID', '');
    const fetchSpy = vi.spyOn(globalThis, 'fetch');

    await expect(sendBookingNotification(booking)).resolves.toEqual({ sent: false, reason: 'not_configured' });
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it('posts the formatted notification to the configured chat', async () => {
    vi.stubEnv('TELEGRAM_BOT_TOKEN', 'test-token');
    vi.stubEnv('TELEGRAM_NOTIFICATION_CHAT_ID', '123456');
    const fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response(JSON.stringify({ ok: true, result: {} }), { status: 200 }),
    );

    await expect(sendBookingNotification(booking)).resolves.toEqual({ sent: true });
    expect(fetchSpy).toHaveBeenCalledWith(
      'https://api.telegram.org/bottest-token/sendMessage',
      expect.objectContaining({ method: 'POST' }),
    );
    const request = fetchSpy.mock.calls[0][1] as RequestInit;
    expect(JSON.parse(String(request.body))).toMatchObject({
      chat_id: '123456',
      parse_mode: 'HTML',
    });
  });
});

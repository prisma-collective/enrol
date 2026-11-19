import { NextRequest } from 'next/server';
import { POST } from '@/app/api/webhook/route';
import { routeEnrolmentMessage } from '@/lib/enrolment/routeMessage';
import { sendTelegramMessage } from '@/lib/telegram';

jest.mock('@/lib/enrolment/routeMessage', () => ({
  routeEnrolmentMessage: jest.fn(async () => ({ route: 'ask', reply: null })),
}));
jest.mock('@/lib/telegram', () => ({
  ...jest.requireActual('@/lib/telegram'),
  sendTelegramMessage: jest.fn(async () => ({ message_id: 1 })),
}));

// A synthetic update: no real chat.
const update = JSON.stringify({
  update_id: 999,
  message: { message_id: 1, chat: { id: -1001234567890, type: 'supergroup' }, text: '/ask List all active hubs' },
});

function post(secret?: string) {
  return POST(
    new NextRequest('http://localhost:3000/api/webhook', {
      method: 'POST',
      body: update,
      headers: secret === undefined ? {} : { 'x-telegram-bot-api-secret-token': secret },
    })
  );
}

describe('Telegram webhook /api/webhook', () => {
  const original = process.env.TELEGRAM_WEBHOOK_SECRET;
  beforeEach(() => {
    process.env.TELEGRAM_WEBHOOK_SECRET = 'synthetic-secret';
    (routeEnrolmentMessage as jest.Mock).mockClear();
    (sendTelegramMessage as jest.Mock).mockClear();
  });
  afterAll(() => {
    process.env.TELEGRAM_WEBHOOK_SECRET = original;
  });

  it('refuses a forged update with no secret', async () => {
    const res = await post();
    expect(res.status).toBe(401);
    expect(routeEnrolmentMessage).not.toHaveBeenCalled();
    expect(sendTelegramMessage).not.toHaveBeenCalled();
  });

  it('refuses a wrong secret', async () => {
    expect((await post('synthetic-secreT')).status).toBe(401);
    expect((await post('synthetic-secret-longer')).status).toBe(401);
    expect(routeEnrolmentMessage).not.toHaveBeenCalled();
  });

  it('refuses every update when no secret is configured', async () => {
    delete process.env.TELEGRAM_WEBHOOK_SECRET;
    expect((await post('')).status).toBe(500);
    expect(routeEnrolmentMessage).not.toHaveBeenCalled();
  });

  it('handles an update with the right secret', async () => {
    const res = await post('synthetic-secret');
    expect(res.status).toBe(200);
    expect(routeEnrolmentMessage).toHaveBeenCalledTimes(1);
  });
});

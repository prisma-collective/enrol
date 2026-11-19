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

function post(authorization?: string) {
  return POST(
    new NextRequest('http://localhost:3000/api/webhook', {
      method: 'POST',
      body: update,
      headers: authorization === undefined ? {} : { authorization },
    })
  );
}

// Telegram calls timelining; timelining forwards _botEnrolment updates here
// with Authorization: Bearer <PRIVATE_API_TOKEN> (internalDispatchHeaders).
describe('Bot webhook /api/webhook (forwarded by timelining)', () => {
  const original = process.env.PRIVATE_API_TOKEN;
  beforeEach(() => {
    process.env.PRIVATE_API_TOKEN = 'synthetic-token';
    (routeEnrolmentMessage as jest.Mock).mockClear();
    (sendTelegramMessage as jest.Mock).mockClear();
  });
  afterAll(() => {
    process.env.PRIVATE_API_TOKEN = original;
  });

  it('refuses a forged update with no token', async () => {
    const res = await post();
    expect(res.status).toBe(401);
    expect(routeEnrolmentMessage).not.toHaveBeenCalled();
    expect(sendTelegramMessage).not.toHaveBeenCalled();
  });

  it('refuses a wrong token', async () => {
    expect((await post('Bearer synthetic-tokeN')).status).toBe(401);
    expect((await post('Bearer synthetic-token-longer')).status).toBe(401);
    expect((await post('synthetic-token')).status).toBe(401);
    expect(routeEnrolmentMessage).not.toHaveBeenCalled();
  });

  it('refuses every update when no token is configured', async () => {
    delete process.env.PRIVATE_API_TOKEN;
    expect((await post('Bearer ')).status).toBe(500);
    expect(routeEnrolmentMessage).not.toHaveBeenCalled();
  });

  it('handles an update forwarded with the token', async () => {
    const res = await post('Bearer synthetic-token');
    expect(res.status).toBe(200);
    expect(routeEnrolmentMessage).toHaveBeenCalledTimes(1);
  });
});

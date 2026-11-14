import { createHmac } from 'crypto';
import { NextRequest } from 'next/server';
import { DELETE, GET, POST } from '@/app/api/submission/route';
import { redis } from '@/lib/redis';
import { isValidSignature } from '@/lib/utils';

jest.mock('@/lib/redis', () => ({
  redis: { lpush: jest.fn(), lrange: jest.fn(), lrem: jest.fn() },
}));

jest.mock('@/lib/atproto/enrol', () => ({
  publishSubmission: jest.fn(),
  publisherFromEnv: jest.fn(() => null),
}));

const mockedRedis = redis as unknown as {
  lpush: jest.Mock;
  lrange: jest.Mock;
  lrem: jest.Mock;
};

// Synthetic application: no real person's data.
const queued = JSON.stringify({
  eventId: 'evt-synthetic-1',
  createdAt: '2026-11-14T10:00:00Z',
  data: { formName: 'Synthetic hub form' },
});

const URL = 'http://localhost:3000/api/submission';

function sign(body: string, secret: string) {
  return createHmac('sha256', secret).update(body).digest('base64');
}

describe('API /api/submission', () => {
  const originalToken = process.env.PRIVATE_API_TOKEN;
  const originalSecret = process.env.WEBHOOK_SIGNING_SECRET;

  beforeEach(() => {
    process.env.PRIVATE_API_TOKEN = 'test-token';
    process.env.WEBHOOK_SIGNING_SECRET = 'test-secret';
    mockedRedis.lpush.mockReset();
    mockedRedis.lrange.mockReset().mockResolvedValue([queued]);
    mockedRedis.lrem.mockReset().mockResolvedValue(1);
  });

  afterAll(() => {
    process.env.PRIVATE_API_TOKEN = originalToken;
    process.env.WEBHOOK_SIGNING_SECRET = originalSecret;
  });

  describe('GET', () => {
    it('refuses a request with no token', async () => {
      const res = await GET(new NextRequest(URL));
      expect(res.status).toBe(401);
      expect(mockedRedis.lrange).not.toHaveBeenCalled();
    });

    it('refuses a wrong token', async () => {
      const res = await GET(new NextRequest(URL, { headers: { Authorization: 'Bearer nope' } }));
      expect(res.status).toBe(401);
      expect(mockedRedis.lrange).not.toHaveBeenCalled();
    });

    it('refuses everyone when PRIVATE_API_TOKEN is not set', async () => {
      delete process.env.PRIVATE_API_TOKEN;
      const res = await GET(new NextRequest(URL, { headers: { Authorization: 'Bearer ' } }));
      expect(res.status).toBe(500);
      expect(mockedRedis.lrange).not.toHaveBeenCalled();
    });

    it('returns the queue with the infra token', async () => {
      const res = await GET(new NextRequest(URL, { headers: { Authorization: 'Bearer test-token' } }));
      expect(res.status).toBe(200);
      expect((await res.json()).messages).toHaveLength(1);
    });
  });

  describe('DELETE', () => {
    const body = JSON.stringify({ eventId: 'evt-synthetic-1' });

    it('refuses a request with no token', async () => {
      const res = await DELETE(new NextRequest(URL, { method: 'DELETE', body }));
      expect(res.status).toBe(401);
      expect(mockedRedis.lrem).not.toHaveBeenCalled();
    });

    it('deletes with the infra token', async () => {
      const res = await DELETE(
        new NextRequest(URL, { method: 'DELETE', body, headers: { Authorization: 'Bearer test-token' } })
      );
      expect(res.status).toBe(200);
      expect(mockedRedis.lrem).toHaveBeenCalledWith('enrolment-submissions', 1, queued);
    });

    it('answers 400 to a body that is not JSON', async () => {
      const res = await DELETE(
        new NextRequest(URL, { method: 'DELETE', body: 'x', headers: { Authorization: 'Bearer test-token' } })
      );
      expect(res.status).toBe(400);
    });
  });

  describe('POST (Tally webhook)', () => {
    it('queues a correctly signed submission', async () => {
      const res = await POST(
        new NextRequest(URL, {
          method: 'POST',
          body: queued,
          headers: { 'tally-signature': sign(queued, 'test-secret') },
        })
      );
      expect(res.status).toBe(200);
      expect(mockedRedis.lpush).toHaveBeenCalledTimes(1);
    });

    it('refuses a submission signed with an empty secret when none is set', async () => {
      delete process.env.WEBHOOK_SIGNING_SECRET;
      const res = await POST(
        new NextRequest(URL, {
          method: 'POST',
          body: queued,
          headers: { 'tally-signature': sign(queued, '') },
        })
      );
      expect(res.status).toBe(401);
      expect(mockedRedis.lpush).not.toHaveBeenCalled();
    });
  });
});

describe('isValidSignature', () => {
  const originalSecret = process.env.WEBHOOK_SIGNING_SECRET;
  afterAll(() => {
    process.env.WEBHOOK_SIGNING_SECRET = originalSecret;
  });

  it('accepts the right signature', () => {
    process.env.WEBHOOK_SIGNING_SECRET = 'test-secret';
    expect(isValidSignature('payload', sign('payload', 'test-secret'))).toBe(true);
  });

  it('refuses a signature made with another secret', () => {
    process.env.WEBHOOK_SIGNING_SECRET = 'test-secret';
    expect(isValidSignature('payload', sign('payload', 'other'))).toBe(false);
  });

  it('refuses a missing signature', () => {
    process.env.WEBHOOK_SIGNING_SECRET = 'test-secret';
    expect(isValidSignature('payload', '')).toBe(false);
  });

  it('refuses everything when the secret is empty', () => {
    process.env.WEBHOOK_SIGNING_SECRET = '';
    expect(isValidSignature('payload', sign('payload', ''))).toBe(false);
  });
});

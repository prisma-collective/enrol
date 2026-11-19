import { NextRequest } from 'next/server';

// The three form queues hold applicants' answers. Reading them needs the
// infra token.
const lrange = jest.fn().mockResolvedValue([JSON.stringify({ createdAt: '2026-11-17T00:00:00Z', data: { formName: 'synthetic' } })]);
jest.mock('@/lib/redis', () => ({ redis: { lrange: (...args: unknown[]) => lrange(...args), lpush: jest.fn() } }));

import { GET as teams } from '@/app/api/webhook/form/participants/teams/route';
import { GET as curation } from '@/app/api/webhook/form/hubs/curation/route';
import { GET as evaluators } from '@/app/api/webhook/form/partners/external-evaluators/route';

const routes = [
  ['participants/teams', teams],
  ['hubs/curation', curation],
  ['partners/external-evaluators', evaluators],
] as const;

function get(path: string, auth?: string) {
  return new NextRequest(`http://localhost:3000/api/webhook/form/${path}`, {
    method: 'GET',
    headers: auth ? { Authorization: auth } : {},
  });
}

describe('form queues need the infra token to be read', () => {
  const originalToken = process.env.PRIVATE_API_TOKEN;

  beforeEach(() => {
    process.env.PRIVATE_API_TOKEN = 'test-token';
    lrange.mockClear();
  });

  afterAll(() => {
    process.env.PRIVATE_API_TOKEN = originalToken;
  });

  it.each(routes)('%s refuses a request without a token', async (path, GET) => {
    const res = await GET(get(path));
    expect(res.status).toBe(401);
    expect(lrange).not.toHaveBeenCalled();
  });

  it.each(routes)('%s refuses a wrong token, of the same or another length', async (path, GET) => {
    expect((await GET(get(path, 'Bearer test-tokem'))).status).toBe(401);
    expect((await GET(get(path, 'Bearer short'))).status).toBe(401);
    expect(lrange).not.toHaveBeenCalled();
  });

  it.each(routes)('%s fails closed when no token is configured', async (path, GET) => {
    delete process.env.PRIVATE_API_TOKEN;
    const res = await GET(get(path, 'Bearer test-token'));
    expect(res.status).toBe(500);
    expect(lrange).not.toHaveBeenCalled();
  });

  it.each(routes)('%s returns the queue with the right token', async (path, GET) => {
    const res = await GET(get(path, 'Bearer test-token'));
    expect(res.status).toBe(200);
    expect((await res.json()).messages).toHaveLength(1);
  });
});

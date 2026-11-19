import { timingSafeEqual } from 'node:crypto';
import { NextRequest, NextResponse } from 'next/server';
import { logger } from '@/lib/logger';

export function verifyInfraRequest(request: NextRequest): NextResponse | null {
  const expected = process.env.PRIVATE_API_TOKEN;
  if (!expected) {
    logger.warn('Infra auth rejected: PRIVATE_API_TOKEN not configured', {
      path: request.nextUrl.pathname,
    });
    return NextResponse.json(
      { error: 'PRIVATE_API_TOKEN not configured' },
      { status: 500 }
    );
  }

  const header = request.headers.get('authorization');
  if (!header?.startsWith('Bearer ')) {
    logger.warn('Infra auth rejected: missing or invalid Authorization header', {
      path: request.nextUrl.pathname,
      hasAuthHeader: !!header,
    });
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const token = header.slice('Bearer '.length);
  if (!sameToken(token, expected)) {
    logger.warn('Infra auth rejected: token mismatch', {
      path: request.nextUrl.pathname,
    });
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  return null;
}

// Compares in constant time, so the response time doesn't tell how much of
// a guessed token was right. timingSafeEqual needs equal lengths; a length
// mismatch is refused without comparing.
function sameToken(given: string, expected: string): boolean {
  const a = Buffer.from(given);
  const b = Buffer.from(expected);
  return a.length === b.length && timingSafeEqual(a, b);
}

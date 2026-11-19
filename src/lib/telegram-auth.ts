import { timingSafeEqual } from 'node:crypto';
import { NextRequest, NextResponse } from 'next/server';
import { logger } from '@/lib/logger';

/**
 * Telegram sends the secret set with setWebhook (secret_token) in
 * `X-Telegram-Bot-Api-Secret-Token`. Without that check anyone could post a
 * forged update and make the bot write to any chat, or ask evaluate.
 * Fails closed when TELEGRAM_WEBHOOK_SECRET is unset.
 */
export function verifyTelegramRequest(request: NextRequest): NextResponse | null {
  const expected = process.env.TELEGRAM_WEBHOOK_SECRET;
  if (!expected) {
    logger.warn('Telegram webhook refused: TELEGRAM_WEBHOOK_SECRET not configured');
    return NextResponse.json({ error: 'TELEGRAM_WEBHOOK_SECRET not configured' }, { status: 500 });
  }
  const given = Buffer.from(request.headers.get('x-telegram-bot-api-secret-token') ?? '');
  const want = Buffer.from(expected);
  if (given.length !== want.length || !timingSafeEqual(given, want)) {
    logger.warn('Telegram webhook refused: wrong or missing secret token');
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  return null;
}

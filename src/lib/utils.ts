import { createHmac, timingSafeEqual } from 'crypto';
import { logger } from '@/lib/logger';

export function handleError(error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }

// Tally signs each webhook with HMAC-SHA256 over the raw body. Without
// WEBHOOK_SIGNING_SECRET no signature is valid: an empty secret would let
// anyone sign a request, since the key is then known to everyone.
export function isValidSignature(payload: string, receivedSignature: string): boolean {
  const secret = process.env.WEBHOOK_SIGNING_SECRET ?? '';
  if (!secret) {
    logger.error('Webhook rejected: WEBHOOK_SIGNING_SECRET is not set');
    return false;
  }
  if (!receivedSignature) return false;

  const calculated = createHmac('sha256', secret).update(payload).digest('base64');
  const a = Buffer.from(calculated);
  const b = Buffer.from(receivedSignature);
  return a.length === b.length && timingSafeEqual(a, b);
}

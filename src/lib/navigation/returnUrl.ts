/**
 * The "Back to Console" link comes from `?return=` in the URL, so anyone
 * can write it. Only an http(s) URL on an allowed origin becomes a link:
 * never `javascript:` or `data:`, and never another site.
 *
 * Allowed origins: NEXT_PUBLIC_RETURN_ORIGINS (comma-separated, e.g.
 * `https://console.prisma.events`), plus localhost and 127.0.0.1 for
 * development.
 */
const LOCAL_HOSTS = ['localhost', '127.0.0.1', '[::1]'];

export function safeReturnUrl(
  raw: string | null,
  allowed: string | undefined = process.env.NEXT_PUBLIC_RETURN_ORIGINS,
): string | null {
  if (!raw) return null;
  let url: URL;
  try {
    url = new URL(raw);
  } catch {
    return null;
  }
  if (url.protocol !== 'https:' && url.protocol !== 'http:') return null;
  if (url.username || url.password) return null;
  const origins = (allowed ?? '')
    .split(',')
    .map((o) => o.trim().replace(/\/+$/, ''))
    .filter(Boolean);
  const ok = LOCAL_HOSTS.includes(url.hostname) || (url.protocol === 'https:' && origins.includes(url.origin));
  return ok ? url.toString() : null;
}

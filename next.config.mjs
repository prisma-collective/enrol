// Content Security Policy (security review, hardening checklist).
// enrol embeds only Tally forms and YouTube guide videos, and the browser
// calls no other origin. Next.js inlines its bootstrap scripts, so
// script-src keeps 'unsafe-inline' until we move to per-request nonces;
// the policy still blocks scripts from other hosts, plugins, <base>
// rewrites, form posts elsewhere, and framing of enrol by other sites.
const isDev = process.env.NODE_ENV !== 'production';

const csp = [
  "default-src 'self'",
  `script-src 'self' 'unsafe-inline' https://tally.so${isDev ? " 'unsafe-eval'" : ''}`,
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob: https:",
  "font-src 'self' data:",
  "connect-src 'self' https://tally.so",
  "frame-src https://tally.so https://www.youtube.com https://www.youtube-nocookie.com",
  "frame-ancestors 'none'",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
].join('; ');

export const securityHeaders = [
  { key: 'Content-Security-Policy', value: csp },
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
];

/** @type {import('next').NextConfig} */
const nextConfig = {
  async headers() {
    return [{ source: '/:path*', headers: securityHeaders }];
  },
  async rewrites() {
    return [
      {
        source: '/webhook',
        destination: '/api/webhook',
      },
    ];
  },
  webpack: (config, { isServer }) => {
    if (!isServer) {
      config.cache = {
        type: 'filesystem', // Use filesystem caching
      };
    }
    return config;
  },
};

export default nextConfig;

import { safeReturnUrl } from '@/lib/navigation/returnUrl';

const ALLOWED = 'https://console.prisma.events, https://pilot-console.prisma.foo/';

describe('safeReturnUrl', () => {
  it('keeps an allowed console origin', () => {
    expect(safeReturnUrl('https://console.prisma.events/enrol?x=1', ALLOWED)).toBe('https://console.prisma.events/enrol?x=1');
    expect(safeReturnUrl('https://pilot-console.prisma.foo/', ALLOWED)).toBe('https://pilot-console.prisma.foo/');
  });

  it('keeps localhost for development', () => {
    expect(safeReturnUrl('http://localhost:3001/enrol', undefined)).toBe('http://localhost:3001/enrol');
    expect(safeReturnUrl('http://127.0.0.1:3001/', '')).toBe('http://127.0.0.1:3001/');
  });

  it('drops scripts, data and other sites', () => {
    for (const bad of [
      'javascript:alert(document.domain)',
      'JaVaScRiPt:alert(1)',
      'data:text/html,<script>alert(1)</script>',
      'https://evil-phish.example/console',
      'https://console.prisma.events.evil.example/',
      'http://console.prisma.events/',
      'https://user:pass@console.prisma.events/',
      '//evil.example',
      '/relative',
      '',
    ]) {
      expect(safeReturnUrl(bad, ALLOWED)).toBeNull();
    }
    expect(safeReturnUrl(null, ALLOWED)).toBeNull();
  });
});

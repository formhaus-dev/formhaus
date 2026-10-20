import type { HeadConfig } from 'vitepress';

type EventData = Record<string, string | number>;

declare global {
  interface Window {
    umami?: { track: (name: string, data?: EventData) => unknown };
  }
  interface Navigator {
    globalPrivacyControl?: boolean;
  }
}

const umamiWebsiteId = 'abeb3361-e26b-4aaf-a25c-ef868c82f9b6';

const respectGpc = 'window.fhBeforeSend=function(t,p){return navigator.globalPrivacyControl===true?false:p}';
const appHost = 'app.formhaus.dev';
const signupPaths = ['/login', '/forms/new'];
const sourceKeys = ['utm_source', 'utm_medium', 'utm_campaign', 'ref'];
const installCommand = /^\s*(?:\$\s*)?(?:npm|pnpm|yarn|bun)\s+(?:i|install|add)\s([^\n#]*)/;
const formhausPackage = /@formhaus\/([a-z-]+)/g;

let landing: Record<string, string> | null = null;

export function analyticsHead(build: 'site' | 'docs'): HeadConfig[] {
  return [
    ['script', {}, respectGpc],
    [
      'script',
      {
        defer: '',
        src: '/s/script.js',
        'data-website-id': umamiWebsiteId,
        'data-domains': 'formhaus.dev',
        'data-tag': build,
        'data-do-not-track': 'true',
        'data-before-send': 'fhBeforeSend',
      },
    ],
  ];
}

export function track(name: string, data?: EventData) {
  try {
    window.umami?.track(name, data);
  } catch {}
}

export function trackingAllowed(nav: Pick<Navigator, 'doNotTrack' | 'globalPrivacyControl'>): boolean {
  return nav.doNotTrack !== '1' && nav.globalPrivacyControl !== true;
}

export function landingSource(href: string, referrer: string): Record<string, string> {
  const params = new URL(href).searchParams;
  const source: Record<string, string> = {};
  for (const key of sourceKeys) {
    const value = params.get(key);
    if (value) source[key] = value;
  }
  if (!source.ref && referrer) {
    const host = new URL(referrer).hostname;
    if (host && host !== 'formhaus.dev' && !host.endsWith('.formhaus.dev')) source.ref = host;
  }
  return source;
}

export function withSource(href: string, source: Record<string, string>, from?: string): string | null {
  const url = new URL(href);
  if (url.hostname !== appHost || !signupPaths.includes(url.pathname)) return null;
  for (const [key, value] of Object.entries(source)) {
    if (!url.searchParams.has(key)) url.searchParams.set(key, value);
  }
  if (from && !url.searchParams.has('from')) url.searchParams.set('from', from);
  return url.toString();
}

export function codeLanguage(button: Element): string {
  const block = button.parentElement?.className ?? '';
  return /(?:^|\s)language-([\w-]+)/.exec(block)?.[1] ?? 'text';
}

export function installedPackage(code: string): string | null {
  const args = installCommand.exec(code)?.[1] ?? '';
  const names = Array.from(args.matchAll(formhausPackage), (match) => match[1]);
  return names.find((name) => name !== 'core') ?? names[0] ?? null;
}

function trackCopy(button: Element) {
  const pkg = installedPackage(button.parentElement?.querySelector('pre code')?.textContent ?? '');
  if (pkg) track('install-copy', { pkg, location: 'docs' });
  else track('docs-code-copy', { lang: codeLanguage(button) });
}

function onClick(event: MouseEvent) {
  const target = event.target instanceof Element ? event.target : null;
  const copy = target?.closest('div[class*="language-"] > button.copy');
  if (copy) trackCopy(copy);
  const link = target?.closest<HTMLAnchorElement>('a[href]');
  if (!link || !landing || !trackingAllowed(navigator)) return;
  const decorated = withSource(link.href, landing, link.dataset.umamiEventLocation);
  if (decorated) link.href = decorated;
}

export function startAnalytics() {
  if (typeof window === 'undefined' || landing) return;
  try {
    landing = landingSource(window.location.href, document.referrer);
  } catch {
    landing = {};
  }
  document.addEventListener('click', onClick, true);
}

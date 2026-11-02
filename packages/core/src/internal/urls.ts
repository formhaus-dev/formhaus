const SCHEME = /^([a-z][a-z0-9+.-]*):/i;
const AUTHORITY = /^[/\\]*([^/\\?#]*)/;
const IMAGE_DATA = /^image\/(?:png|jpeg|webp|gif)[;,]/i;

function trimmed(text: string): string {
  let start = 0;
  let end = text.length;
  while (start < end && text.charCodeAt(start) <= 0x20) start++;
  while (end > start && text.charCodeAt(end - 1) <= 0x20) end--;
  return text.slice(start, end);
}

function checked(text: string | undefined, allow: (scheme: string, rest: string) => boolean): string | undefined {
  const url = typeof text === 'string' ? trimmed(text.replace(/[\t\n\r]/g, '')) : '';
  if (!url) return undefined;
  const match = SCHEME.exec(url);
  const scheme = match?.[1].toLowerCase();
  const rest = url.slice(match ? match[0].length : 0);
  const web = scheme === undefined ? /^[/\\]{2}/.test(url) : scheme === 'http' || scheme === 'https';
  if (web && AUTHORITY.exec(rest)![1].includes('@')) return undefined;
  return scheme === undefined || allow(scheme, rest) ? text : undefined;
}

export const imageSource = (image: string | undefined): string | undefined =>
  checked(
    image,
    (scheme, rest) => scheme === 'http' || scheme === 'https' || scheme === 'blob' || (scheme === 'data' && IMAGE_DATA.test(rest)),
  );

export const linkSource = (link: string | undefined): string | undefined =>
  checked(link, (scheme) => scheme === 'http' || scheme === 'https');

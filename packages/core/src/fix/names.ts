function words(text: string): string[] {
  return text
    .toLowerCase()
    .normalize('NFKD')
    .replace(/\p{M}/gu, '')
    .replace(/['’]/g, '')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim()
    .split(' ')
    .filter(Boolean);
}

export function unique(base: string, taken: Iterable<string>, join = ''): string {
  const used = new Set(taken);
  let value = base;
  for (let index = 2; used.has(value); index++) value = `${base}${join}${index}`;
  return value;
}

export const slug = (text: unknown, fallback: string) => (typeof text === 'string' && words(text).join('-')) || fallback;

export function camel(text: unknown, fallback: string): string {
  const base =
    typeof text === 'string'
      ? words(text)
          .map((word, index) => (index ? word[0].toUpperCase() + word.slice(1) : word))
          .join('')
      : '';
  if (!base) return fallback;
  return /^\d/.test(base) ? `q${base}` : base;
}

export function humanize(key: string): string {
  const text = key
    .replace(/([a-z\d])([A-Z])/g, '$1 $2')
    .replace(/[_\-.]+/g, ' ')
    .trim()
    .toLowerCase();
  return text ? text[0].toUpperCase() + text.slice(1) : key;
}

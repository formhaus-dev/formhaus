import { isEntry } from '../visibility/nodes';
import { CATALOGS } from './nodes';

export interface CatalogIssues {
  missing: string[];
  unknown: string[];
}

export const PLURALS = ['zero', 'one', 'two', 'few', 'many', 'other'];

export function localeChain(tag: string): string[] {
  const chain: string[] = [];
  try {
    const subtags = tag.replace(/_/g, '-').split('-');
    const cut = subtags.findIndex((subtag, index) => index > 0 && subtag.length === 1);
    const parts = Intl.getCanonicalLocales(subtags.slice(0, cut < 0 ? undefined : cut).join('-'))[0].split('-');
    chain.push(...parts.map((_, index) => parts.slice(0, parts.length - index).join('-')));
    const { language, region } = new Intl.Locale(chain[0]).maximize();
    if (region) chain.splice(Math.max(chain.length - 1, 1), 0, `${language}-${region}`);
  } catch {}
  return [...new Set([...chain.filter((item) => item !== 'en'), 'en'])];
}

export function checkCatalog(catalog: unknown): CatalogIssues {
  const result: CatalogIssues = { missing: [], unknown: [] };
  const root = isEntry(catalog) ? catalog : {};
  if (typeof root.locale !== 'string' || !root.locale.trim()) result.missing.push('locale');
  result.unknown.push(...Object.keys(root).filter((key) => !['locale', 'messages', 'labels'].includes(key)));
  for (const part of ['messages', 'labels'] as const) {
    const known = Object.keys(CATALOGS[part]);
    const block = isEntry(root[part]) ? root[part] : {};
    for (const key of known) {
      const text = block[key];
      if (isEntry(text)) {
        if (typeof text.other !== 'string' || !text.other.trim()) result.missing.push(`${part}.${key}.other`);
        result.unknown.push(
          ...Object.keys(text)
            .filter((form) => !PLURALS.includes(form) || typeof text[form] !== 'string')
            .map((form) => `${part}.${key}.${form}`),
        );
      } else if (typeof text !== 'string' || !text.trim()) result.missing.push(`${part}.${key}`);
    }
    result.unknown.push(
      ...Object.keys(block)
        .filter((key) => !known.includes(key))
        .map((key) => `${part}.${key}`),
    );
  }
  return result;
}

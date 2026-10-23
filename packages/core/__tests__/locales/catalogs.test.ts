import { readdirSync, readFileSync } from 'node:fs';
import { checkCatalog, defaultLabels, defaultMessages, type LocaleCatalog, type LocaleText } from '../../src/i18n';
import { describe, expect, it } from 'vitest';

const directory = new URL('../../locales/', import.meta.url);
const files = readdirSync(directory).filter((file) => file.endsWith('.json'));
const read = (file: string): LocaleCatalog => JSON.parse(readFileSync(new URL(file, directory), 'utf8'));
const english: Record<string, Record<string, string>> = { messages: defaultMessages, labels: defaultLabels };
const placeholders = (text: string) => [...text.matchAll(/\{(\w+)\}/g)].map(([, name]) => name).sort();
const texts = (catalog: LocaleCatalog) =>
  (['messages', 'labels'] as const).flatMap((part) =>
    Object.entries(catalog[part] as Record<string, LocaleText>).map(([key, text]) => ({ part, key, text })),
  );

describe('locale catalogs', () => {
  it('ships the first set of languages', () => {
    expect(files.map((file) => file.replace('.json', '')).sort()).toEqual(
      ['de', 'en', 'es', 'fr', 'fr-CA', 'it', 'ja', 'pt-BR', 'ru', 'uk', 'zh-CN'].sort(),
    );
  });

  it('keeps the English catalog equal to the built-in texts', () => {
    expect(read('en.json')).toEqual({ locale: 'en', messages: defaultMessages, labels: defaultLabels });
  });

  describe.each(files)('%s', (file) => {
    const catalog = read(file);

    it('names its file and has every key', () => {
      expect(catalog.locale).toBe(file.replace('.json', ''));
      expect(Intl.getCanonicalLocales(catalog.locale)).toEqual([catalog.locale]);
      expect(checkCatalog(catalog)).toEqual({ missing: [], unknown: [] });
    });

    it('keeps the placeholders of the English texts', () => {
      for (const { part, key, text } of texts(catalog)) {
        const expected = placeholders(english[part][key]);
        for (const form of typeof text === 'string' ? [text] : Object.values(text))
          expect(placeholders(form), `${part}.${key}: ${form}`).toEqual(expected);
      }
    });

    it('has exactly the plural forms of its language', () => {
      const categories = [...new Intl.PluralRules(catalog.locale).resolvedOptions().pluralCategories].sort();
      for (const { part, key, text } of texts(catalog)) {
        if (typeof text !== 'string') expect(Object.keys(text).sort(), `${part}.${key}`).toEqual(categories);
      }
    });

    it('has trimmed texts', () => {
      for (const { part, key, text } of texts(catalog)) {
        for (const form of typeof text === 'string' ? [text] : Object.values(text)) expect(form.trim(), `${part}.${key}`).toBe(form);
      }
    });
  });
});

import { describe, expect, it } from 'vitest';
import { loadLocale } from '../../../../docs/recipes/snippets/locale-catalogs';

describe('loadLocale recipe', () => {
  it('loads the catalogs of the fallback chain and leaves English to the built-in texts', async () => {
    const locales = async (tag: string) => (await loadLocale(tag)).map(({ locale }) => locale);
    expect(await locales('fr-CA')).toEqual(['fr-CA', 'fr']);
    expect(await locales('ru-RU')).toEqual(['ru']);
    expect(await locales('zh-Hans-CN')).toEqual(['zh-CN']);
    expect(await locales('pt')).toEqual(['pt-BR']);
    expect(await locales('en-GB')).toEqual([]);
  });
});

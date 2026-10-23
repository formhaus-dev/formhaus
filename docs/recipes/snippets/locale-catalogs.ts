import type { LocaleCatalog } from '@formhaus/core';
import { localeChain } from '@formhaus/core/i18n';

const catalogs: Record<string, () => Promise<{ default: LocaleCatalog }>> = {
  de: () => import('@formhaus/core/locales/de'),
  es: () => import('@formhaus/core/locales/es'),
  fr: () => import('@formhaus/core/locales/fr'),
  'fr-CA': () => import('@formhaus/core/locales/fr-CA'),
  it: () => import('@formhaus/core/locales/it'),
  ja: () => import('@formhaus/core/locales/ja'),
  'pt-BR': () => import('@formhaus/core/locales/pt-BR'),
  ru: () => import('@formhaus/core/locales/ru'),
  uk: () => import('@formhaus/core/locales/uk'),
  'zh-CN': () => import('@formhaus/core/locales/zh-CN'),
};

export async function loadLocale(tag: string): Promise<LocaleCatalog[]> {
  const tags = localeChain(tag).filter((name) => Object.hasOwn(catalogs, name));
  return Promise.all(tags.map(async (name) => (await catalogs[name]()).default));
}

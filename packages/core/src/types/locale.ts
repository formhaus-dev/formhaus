import type { LocaleCatalog } from './i18n';

declare const translated: unique symbol;

export interface Translation {
  readonly locale: string;
  readonly [translated]: true;
}

export type LocaleSource = LocaleCatalog | Translation;

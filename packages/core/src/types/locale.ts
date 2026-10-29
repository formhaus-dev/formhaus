import type { FormDefinition } from './definition';
import type { LocaleCatalog } from './i18n';

export interface Translation {
  locale: string;
  texts(definition: FormDefinition): FormDefinition;
  text(definition: FormDefinition, part: 'messages' | 'labels', key: string, params: Record<string, unknown>): string | undefined;
}

export type LocaleSource = LocaleCatalog | Translation;

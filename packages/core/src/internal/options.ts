import type { FieldOption, FormField } from '../types';
import { isGroup } from '../visibility/nodes';

export type OptionsProvider = (values: Record<string, unknown>) => FieldOption[] | Promise<FieldOption[]>;

export type OptionSource = [key: string, field: FormField];

export const dividerBefore = (field: FormField, options: FieldOption[], index: number): boolean =>
  !field.optionsFrom && !!options[index].exclusive && index > 0 && !options[index - 1].exclusive;

export const optionKey = (group: string, field: string): string => `${group}.${field}`;

const countTexts = (texts: string[]) =>
  texts.reduce((counts, text) => counts.set(text, (counts.get(text) ?? 0) + 1), new Map<string, number>());

export function optionTexts(options: FieldOption[]): string[] {
  const labels = countTexts(options.map(({ label }) => label));
  const texts = options.map(({ label, value }) => (labels.get(label)! > 1 ? `${label} (${value})` : label));
  const counts = countTexts(texts);
  const taken = new Set(texts);
  const next = new Map<string, number>();
  return texts.map((text) => {
    if (counts.get(text)! < 2) return text;
    let index = next.get(text) ?? 1;
    while (taken.has(`${text} (${index})`)) index++;
    next.set(text, index + 1);
    taken.add(`${text} (${index})`);
    return `${text} (${index})`;
  });
}

export function optionSources(fields: FormField[]): OptionSource[] {
  return fields.flatMap((field): OptionSource[] =>
    isGroup(field) ? field.fields.map((child): OptionSource => [optionKey(field.key, child.key), child]) : [[field.key, field]],
  );
}

export function providedOptions(
  sources: OptionSource[],
  providers: Record<string, OptionsProvider> | undefined,
  loaded: Record<string, FieldOption[]>,
): Record<string, FieldOption[]> {
  return Object.fromEntries(
    sources.flatMap(([key, field]) => (field.optionsFrom && providers?.[field.optionsFrom] && loaded[key] ? [[key, loaded[key]]] : [])),
  );
}

export function sameOptions(previous: FieldOption[] | undefined, next: FieldOption[]): boolean {
  return (
    previous?.length === next.length &&
    previous.every((option, index) => (['value', 'label', 'image'] as const).every((key) => option[key] === next[index][key]))
  );
}

export function loadOptions(
  key: string,
  provider: OptionsProvider,
  values: Record<string, unknown>,
  versions: Map<string, number>,
  commit: (key: string, options: FieldOption[]) => void,
): void {
  const version = (versions.get(key) ?? 0) + 1;
  versions.set(key, version);
  try {
    const result = provider(values);
    if (Array.isArray(result)) {
      commit(key, result);
      return;
    }
    result
      .then((options) => {
        if (versions.get(key) === version) commit(key, options);
      })
      .catch(() => {});
  } catch {}
}

import type { FormEngine } from '../engine';
import type { EngineInternals } from '../engine/runtime-internals';
import type { FieldOption, FormField } from '../types';
import { isGroup, optionKey } from '../visibility/nodes';

export type OptionsProvider = (values: Record<string, unknown>) => FieldOption[] | Promise<FieldOption[]>;

export type OptionSource = [key: string, field: FormField];

export const dividerBefore = (field: FormField, options: FieldOption[], index: number): boolean =>
  !field.optionsFrom && !!options[index].exclusive && index > 0 && !options[index - 1].exclusive;

export function imageSource(image: string | undefined): string | undefined {
  try {
    const { protocol, username, password, pathname } = new URL(image!, 'https://x');
    return image?.trim() &&
      !username &&
      !password &&
      (/^(?:https?|blob):$/.test(protocol) || (protocol === 'data:' && /^image\/(?:png|jpeg|webp|gif)[;,]/i.test(pathname)))
      ? image
      : undefined;
  } catch {
    return undefined;
  }
}

const countTexts = (texts: string[]) =>
  texts.reduce((counts, text) => counts.set(text, (counts.get(text) ?? 0) + 1), new Map<string, number>());

export const shownOptions = (
  engine: FormEngine,
  key: string,
  field: FormField,
  options: FieldOption[] | undefined,
  mounted: boolean,
): FieldOption[] | undefined =>
  field.randomize && (mounted || (engine as unknown as EngineInternals).lifecycle.seed) ? engine.orderOptions(key, options) : options;

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
  busy?: (key: string, loading: boolean) => void,
): void {
  const version = (versions.get(key) ?? 0) + 1;
  versions.set(key, version);
  const settle = (options?: FieldOption[]) => {
    if (versions.get(key) !== version) return;
    busy?.(key, false);
    if (options) commit(key, options);
  };
  try {
    const result = provider(values);
    if (Array.isArray(result)) settle(result);
    else {
      busy?.(key, true);
      result.then(settle).catch(() => settle());
    }
  } catch {
    settle();
  }
}

export function watchOptions(
  engine: FormEngine,
  sources: OptionSource[],
  providers: Record<string, OptionsProvider>,
  commit: (key: string, options: FieldOption[]) => void,
  busy: (key: string, loading: boolean) => void,
): () => void {
  const versions = new Map<string, number>();
  const pending = new Set<string>();
  const track = (key: string, loading: boolean) => {
    if (loading) pending.add(key);
    else pending.delete(key);
    busy(key, loading);
  };
  const unsubscribers = sources.flatMap(([key, field]) => {
    const provider = field.optionsFrom && providers[field.optionsFrom];
    if (!provider) return [];
    const resolve = () => loadOptions(key, provider, engine.values, versions, commit, track);
    resolve();
    return [...new Set(field.optionsDependsOn ?? [])].map((dependency) => engine.subscribeField(dependency, resolve));
  });
  return () => {
    for (const unsubscribe of unsubscribers) unsubscribe();
    versions.clear();
    for (const key of pending) busy(key, false);
    pending.clear();
  };
}

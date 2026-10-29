import type { FormEngine } from '../engine';
import { replaceDefinition } from '../engine/replace-definition';
import type { EngineInternals } from '../engine/runtime-internals';
import { retranslateErrors } from '../engine/validation-state';
import { localeKey, localeList, localizedTexts } from '../i18n/catalog';

const internals = (engine: FormEngine) => engine as unknown as EngineInternals;

export const definitionSource = (engine: FormEngine) => internals(engine).source;

export function refreshLocale(engine: FormEngine): void {
  const internal = internals(engine);
  const sources = localeList(internal.lifecycle.locale);
  const key = localeKey(sources);
  if (key.length === internal.localeKey.length && key.every((part, index) => Object.is(part, internal.localeKey[index]))) return;
  internal.localeKey = key;
  if (JSON.stringify(localizedTexts(internal.source, sources)) !== JSON.stringify(internal.definition))
    replaceDefinition(internal, internal.source);
  retranslateErrors(internal);
}

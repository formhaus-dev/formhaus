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
  const previous = internal.localeKey;
  internal.localeKey = key;
  if (previous?.length === key.length && key.every((part, index) => Object.is(part, previous[index]))) return;
  const translated = key.length > 0 || internal.definition !== internal.source;
  if (translated && JSON.stringify(localizedTexts(internal.source, sources)) !== JSON.stringify(internal.definition))
    replaceDefinition(internal, internal.source, true);
  retranslateErrors(internal);
}

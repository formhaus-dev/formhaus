import type { FormEngine } from '../engine';
import { replaceDefinition } from '../engine/replace-definition';
import type { EngineInternals } from '../engine/runtime-internals';
import { localeList, localizedTexts } from '../i18n/catalog';

const internals = (engine: FormEngine) => engine as unknown as EngineInternals;

export const definitionSource = (engine: FormEngine) => internals(engine).source;

export function refreshLocale(engine: FormEngine): void {
  const { source, definition, lifecycle } = internals(engine);
  const shown = localizedTexts(source, localeList(lifecycle.locale));
  if (JSON.stringify(shown) !== JSON.stringify(definition)) replaceDefinition(internals(engine), source);
}

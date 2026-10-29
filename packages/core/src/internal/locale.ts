import type { FormEngine } from '../engine';
import { replaceDefinition } from '../engine/replace-definition';
import type { EngineInternals } from '../engine/runtime-internals';
import { localeList } from '../i18n/catalog';
import { localizeTexts } from '../i18n/localize';

const internals = (engine: FormEngine) => engine as unknown as EngineInternals;

export const definitionSource = (engine: FormEngine) => internals(engine).source;

export function refreshLocale(engine: FormEngine): void {
  const { source, definition, lifecycle } = internals(engine);
  const shown = localizeTexts(source, localeList(lifecycle.locale));
  if (JSON.stringify(shown) !== JSON.stringify(definition)) replaceDefinition(internals(engine), source);
}

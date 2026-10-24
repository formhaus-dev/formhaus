import type { FormEngine } from '../engine';
import { errorKeys } from '../engine/validation-state';
import type { EngineInternals } from '../engine/runtime-internals';
import { itemLimits } from '../engine/groups';
import { engineLabel } from '../i18n/labels';
import { cut } from '../validation/bounded-text';
import type { ErrorSummary, ErrorSummaryGroup, ErrorSummaryOptions, FormGroup, FormStep, LabelSource } from '../types';
import { isBlank } from '../visibility/evaluate-condition';
import { isEntry, itemsOf } from '../visibility/nodes';
import { fieldDomId, itemDomId } from './ids';
import { recallTemplate, recalled } from './recall';

export { itemLimits };

const internals = (engine: FormEngine) => engine as unknown as EngineInternals;
const visibility = (engine: FormEngine) => internals(engine).visibility;

export function itemTitle(engine: FormEngine, group: FormGroup, index: number, labels?: LabelSource): string {
  const item = { group: group.key, index };
  const params = { label: recalled(engine, group).label, index: index + 1 };
  return group.itemLabel ? recallTemplate(engine, group.itemLabel, item, params) : cut(engineLabel(engine, 'itemLabel', params, labels));
}

export function errorDomId(engine: FormEngine, formId: string | undefined, key: string): string {
  const path = visibility(engine).parse(key);
  return path ? itemDomId(formId, ...path, engine.definition) : fieldDomId(formId, key, engine.definition);
}

function errorGroups(engine: FormEngine, formId: string | undefined, labels?: LabelSource): ErrorSummaryGroup[] {
  const { errors } = engine;
  const { values } = internals(engine).state;
  return (engine.isMultiStep ? engine.visibleSteps : [engine.definition as FormStep]).flatMap((source, index) => {
    const { id, title } = recalled(engine, source);
    const { fields = [] } = source;
    const entries = errorKeys(fields, errors, values).flatMap((key) => {
      const item = visibility(engine).activeItem(key, values);
      const raw = item?.field ?? visibility(engine).activeField(key, values);
      if (!raw) return [];
      const field = recalled(engine, raw, item ? key : undefined);
      const label = item ? `${field.label} (${itemTitle(engine, item.group, item.index, labels)})` : field.label;
      return [
        {
          key,
          id: errorDomId(engine, formId, key),
          text: label + (/[?!:.。]$/.test(label.normalize('NFKC')) ? ' ' : ': ') + errors[key],
          message: errors[key],
        },
      ];
    });
    return entries[0] ? [{ id, title: title || engineLabel(engine, 'stepTitle', { index: index + 1 }, labels), entries }] : [];
  });
}

export function errorSummary(engine: FormEngine, options: ErrorSummaryOptions = {}): ErrorSummary {
  const groups = errorGroups(engine, options.idPrefix, options.labels);
  return { groups, topLevelErrors: engine.topLevelErrors, count: groups.reduce((total, group) => total + group.entries.length, 0) };
}

export function itemHasContent(engine: FormEngine, key: string, index: number): boolean {
  const group = visibility(engine).groups.find((candidate) => candidate.key === key);
  const item = itemsOf(internals(engine).state.values[key])[index];
  if (!group || !isEntry(item)) return false;
  return group.fields.some(({ key: name, defaultValue }) => {
    const value = typeof item[name] === 'string' ? (item[name] as string).trim() : item[name];
    return !isBlank(value) && value !== false && JSON.stringify(value) !== JSON.stringify(defaultValue);
  });
}

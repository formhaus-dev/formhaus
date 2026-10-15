import type { FormEngine } from '../engine';
import { errorKeys } from '../engine/validation-state';
import type { EngineInternals } from '../engine/runtime-internals';
import { itemLimits } from '../engine/groups';
import { labelFor } from '../i18n/labels';
import type { FormGroup, LabelSource } from '../types';
import { isBlank } from '../visibility/evaluate-condition';
import { isEntry, itemsOf } from '../visibility/nodes';
import { formatText } from '../validation/default-messages';
import { fieldDomId, itemDomId } from './ids';

export { itemLimits };

const visibility = (engine: FormEngine) => (engine as unknown as EngineInternals).visibility;

export function itemTitle(group: FormGroup, index: number, ...labels: (LabelSource | undefined)[]): string {
  const params = { label: group.label, index: index + 1 };
  return group.itemLabel ? formatText(group.itemLabel, params) : labelFor('itemLabel', params, ...labels);
}

export function errorDomId(engine: FormEngine, formId: string, key: string): string {
  const path = visibility(engine).parse(key);
  return path ? itemDomId(formId, ...path, engine.definition) : fieldDomId(formId, key, engine.definition);
}

export interface ErrorEntry {
  key: string;
  id: string;
  label: string;
  message: string;
}

export function errorEntries(engine: FormEngine, formId: string, ...labels: (LabelSource | undefined)[]): ErrorEntry[] {
  const { errors, values } = engine;
  const nodes = engine.isMultiStep ? engine.visibleSteps.flatMap((step) => step.fields) : (engine.definition.fields ?? []);
  return errorKeys(nodes, errors, values).flatMap((key) => {
    const item = visibility(engine).activeItem(key, values);
    const field = item?.field ?? visibility(engine).activeField(key, values);
    if (!field) return [];
    const label = item ? `${field.label} (${itemTitle(item.group, item.index, ...labels)})` : field.label;
    return [{ key, id: errorDomId(engine, formId, key), label, message: errors[key] }];
  });
}

export function itemHasContent(engine: FormEngine, key: string, index: number): boolean {
  const group = visibility(engine).groups.find((candidate) => candidate.key === key);
  const item = itemsOf(engine.values[key as never])[index];
  if (!group || !isEntry(item)) return false;
  return group.fields.some(({ key: name, defaultValue }) => {
    const value = typeof item[name] === 'string' ? (item[name] as string).trim() : item[name];
    return !isBlank(value) && value !== false && JSON.stringify(value) !== JSON.stringify(defaultValue);
  });
}

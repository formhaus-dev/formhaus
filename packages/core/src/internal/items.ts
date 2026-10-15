import type { FormEngine } from '../engine';
import { errorKeys } from '../engine/validation-state';
import type { EngineInternals } from '../engine/runtime-internals';
import { itemLimits } from '../engine/groups';
import { labelFor } from '../i18n/labels';
import type { FormGroup, LabelSource } from '../types';
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
  return path ? itemDomId(formId, ...path) : fieldDomId(formId, key);
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

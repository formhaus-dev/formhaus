import type { FormEngine } from '../engine';
import { errorKeys } from '../engine/validation-state';
import type { EngineInternals } from '../engine/runtime-internals';
import { itemLimits } from '../engine/groups';
import { labelFor } from '../i18n/labels';
import type { FormGroup, FormStep, LabelSource } from '../types';
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
  text: string;
}

export interface ErrorGroup {
  id: string;
  title: string;
  entries: ErrorEntry[];
}

export function errorGroups(engine: FormEngine, formId: string, ...labels: (LabelSource | undefined)[]): ErrorGroup[] {
  const { errors, values } = engine;
  return (engine.isMultiStep ? engine.visibleSteps : [engine.definition as FormStep]).flatMap(({ id, title, fields = [] }, index) => {
    const entries = errorKeys(fields, errors, values).flatMap((key) => {
      const item = visibility(engine).activeItem(key, values);
      const field = item?.field ?? visibility(engine).activeField(key, values);
      if (!field) return [];
      const label = item ? `${field.label} (${itemTitle(item.group, item.index, ...labels)})` : field.label;
      return [
        { key, id: errorDomId(engine, formId, key), text: label + (/[?!:.。]$/.test(label.normalize('NFKC')) ? ' ' : ': ') + errors[key] },
      ];
    });
    return entries[0] ? [{ id, title: title || labelFor('stepTitle', { index: index + 1 }, ...labels), entries }] : [];
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

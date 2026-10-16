import { getAllFields } from './engine-utils';
import { createStartValues } from './start-values';
import { indexConditions } from './visibility-index';
import { createActivePath } from './step-routes';
import type { ValidatorFn } from '../validation';
import { validateFields } from '../validation';
import type { FormDefinition, FormField, FormGroup, FormNode, FormSection, FormStep } from '../types';
import { isVisible } from '../visibility';
import {
  conditionFields,
  isEntry,
  isGroup,
  isSection,
  itemPath,
  keepId,
  itemsOf,
  itemScope,
  shownFields,
  splitPath,
  topNodes,
  valueFields,
} from '../visibility/nodes';

interface VisibilityCache {
  visibleSteps: FormStep[];
  currentStep: FormStep | null;
  visibleFields: FormField[];
  visibleNodes: FormNode[];
  canGoNext: boolean;
}

type Values = Record<string, unknown>;

export interface ItemField {
  group: FormGroup;
  index: number;
  field: FormField;
}

export type VisibilityState = ReturnType<typeof createVisibility>;

export function createVisibility(definition: FormDefinition) {
  const allFields = getAllFields(definition);
  const fieldsByKey = new Map<string, FormField[]>();
  const routeFields = new Set<string>();
  const path = createActivePath(definition);
  const fieldDependents = new Map<string, Set<FormField>>();
  const stepDependents = new Map<string, Set<FormStep>>();
  const stepOfField = new Map<FormField, FormStep>();
  const sectionOf = new Map<FormField, FormSection>();
  const groups = allFields.filter(isGroup);
  const starts = createStartValues(groups);
  let visibilityDirty = true;
  let canGoNextDirty = true;
  const cache: VisibilityCache = { visibleSteps: [], currentStep: null, visibleFields: [], visibleNodes: [], canGoNext: false };

  for (const node of topNodes(definition)) if (isSection(node)) for (const field of node.fields) sectionOf.set(field, node);
  for (const field of allFields) {
    fieldsByKey.set(field.key, [...(fieldsByKey.get(field.key) ?? []), field]);
    indexConditions(field, fieldDependents);
    const section = sectionOf.get(field);
    if (section) indexConditions(field, fieldDependents, section);
    if (isGroup(field)) for (const item of field.fields) indexConditions<FormField>(field, fieldDependents, item);
  }
  for (const step of definition.steps ?? []) {
    for (const field of valueFields(step.fields)) stepOfField.set(field, step);
    indexConditions(step, stepDependents);
    for (const route of step.routes ?? []) for (const key of conditionFields(route)) routeFields.add(key);
  }

  const isMultiStep = () => !!definition.steps?.length;
  const visible = (source: FormField | FormStep, values: Values) => {
    const active = path.values(values);
    const section = sectionOf.get(source as FormField);
    return (!section || isVisible(section, active)) && isVisible(source, active);
  };
  const onPath = (field: FormField, values: Values) => {
    const step = stepOfField.get(field);
    return !step || path.steps(values).includes(step);
  };
  const activeField = (key: string, values: Values) =>
    fieldsByKey.get(key)?.find((field) => onPath(field, values) && visible(field, values));

  const parse = (key: string) => {
    if (fieldsByKey.has(key)) return undefined;
    for (const group of groups) {
      const parts = splitPath(group.key, key);
      if (parts) return [group.key, ...parts] as const;
    }
    return undefined;
  };
  const owner = (key: string) => parse(key)?.[0] ?? key;

  function itemFields(group: FormGroup, item: unknown, values: Values): FormField[] {
    const scope = itemScope(group, item, path.values(values));
    return group.fields.filter((field) => isVisible(field, scope));
  }

  function activeItem(key: string, values: Values): ItemField | undefined {
    const parts = parse(key);
    if (!parts) return undefined;
    const [groupKey, index, fieldKey] = parts;
    const group = activeField(groupKey, values);
    const items = itemsOf(values[groupKey]);
    if (!group || !isGroup(group) || index >= items.length) return undefined;
    const field = itemFields(group, items[index], values).find((candidate) => candidate.key === fieldKey);
    return field && { group, index, field };
  }

  function state(values: Values, stepIndex: number): VisibilityCache {
    if (!visibilityDirty) return cache;
    visibilityDirty = false;
    const steps = (cache.visibleSteps = isMultiStep() ? path.steps(values) : []);
    const current = (cache.currentStep = isMultiStep() ? (steps[stepIndex] ?? steps[steps.length - 1] ?? null) : null);
    const source = isMultiStep() ? (current?.fields ?? []) : (definition.fields ?? []);
    const active = path.values(values);
    cache.visibleFields = shownFields(source, active);
    cache.visibleNodes = source
      .filter((node) => isVisible(node, active))
      .map((node) => (isSection(node) ? { ...node, fields: node.fields.filter((field) => isVisible(field, active)) } : node));
    return cache;
  }

  function reconcileItems(values: Values, errors: Record<string, string>, cleared: Set<string>): void {
    for (const group of groups) {
      if (activeField(group.key, values) !== group) continue;
      const source = itemsOf(values[group.key]);
      const items = source.map((item, index) => {
        let result = item;
        for (let round = 0; isEntry(result) && round <= group.fields.length; round++) {
          const entry: Values = result;
          const shown = itemFields(group, entry, values);
          const hidden = group.fields.filter((field) => !shown.includes(field) && entry[field.key] !== undefined);
          const restored: Values = {};
          for (const { key } of shown) {
            const value = entry[key] === undefined ? starts.itemStartValue(item, key) : undefined;
            if (value !== undefined) restored[key] = value;
          }
          if (!hidden.length && !Object.keys(restored).length) break;
          result = keepId(entry, { ...entry, ...restored });
          for (const { key } of hidden) {
            starts.rememberItem(item, key, entry[key]);
            delete (result as Values)[key];
          }
          for (const key of [...hidden.map(({ key }) => key), ...Object.keys(restored)]) cleared.add(itemPath(group.key, index, key));
        }
        return result;
      });
      if (items.some((item, index) => item !== source[index])) values[group.key] = items;
      for (const key of Object.keys(errors)) {
        const [index, field] = splitPath(group.key, key) ?? [];
        if (index === undefined || (index < items.length && itemFields(group, items[index], values).some((item) => item.key === field)))
          continue;
        delete errors[key];
        cleared.add(key);
      }
    }
    path.invalidate();
  }

  return {
    ...starts,
    allFields,
    groups,
    conditionValues: path.values,
    state,
    activeField,
    activeItem,
    itemFields,
    owner,
    parse,

    markChanged(structureChanged: boolean, valuesChanged: boolean): void {
      if (structureChanged) visibilityDirty = true;
      if (structureChanged || valuesChanged) canGoNextDirty = true;
    },

    getCanGoNext(values: Values, stepIndex: number, validators: Record<string, ValidatorFn>): boolean {
      const step = state(values, stepIndex).currentStep;
      if (!canGoNextDirty) return cache.canGoNext;
      canGoNextDirty = false;
      const errors = step ? validateFields(step.fields, path.values(values), validators) : {};
      return (cache.canGoNext = isMultiStep() && Object.keys(errors).length === 0);
    },

    findStepIndex(fieldKey: string, values: Values, stepIndex: number): number | null {
      const key = owner(fieldKey);
      const target = state(values, stepIndex).visibleSteps.findIndex((step) => valueFields(step.fields).some((field) => field.key === key));
      return target === -1 ? null : target;
    },

    affectsStructure(key: string, clearedFields: Set<string>): boolean {
      return routeFields.has(key) || fieldDependents.has(key) || stepDependents.has(key) || clearedFields.size > 0;
    },

    reconcileHidden(values: Values, errors: Record<string, string>, initial = false): Set<string> {
      if (initial) starts.resetStarts(values);
      path.invalidate();
      const dependents = [...new Set([...fieldDependents.keys(), ...stepDependents.keys()])];
      const queue = [...dependents];
      const queued = new Set(queue);
      const cleared = new Set<string>();
      const held = (key: string) => values[key] !== undefined || errors[key] !== undefined;
      const mark = (key: string) => {
        path.invalidate();
        cleared.add(key);
        for (const next of routeFields.has(key) ? [...dependents, key] : [key]) {
          if (queued.has(next)) continue;
          queued.add(next);
          queue.push(next);
        }
      };
      const clear = (key: string) => {
        starts.remember(key, values[key]);
        delete values[key];
        delete errors[key];
        for (const errorKey of Object.keys(errors)) if (owner(errorKey) === key) delete errors[errorKey];
        mark(key);
      };
      const update = (field: FormField, shown: boolean, checked = true) => {
        const { key } = field;
        if (!shown) {
          if (held(key)) clear(key);
          return;
        }
        if (held(key) || !(checked || visible(field, values))) return;
        const value = starts.startValue(field);
        if (value === undefined) return;
        values[key] = value;
        starts.seedItems(value);
        mark(key);
      };
      for (let index = 0; index < queue.length; index++) {
        const key = queue[index];
        queued.delete(key);
        for (const field of fieldDependents.get(key) ?? []) if (onPath(field, values)) update(field, visible(field, values));
        for (const step of stepDependents.get(key) ?? []) {
          for (const field of valueFields(step.fields)) update(field, visible(step, values), false);
        }
      }
      if (groups.length) reconcileItems(values, errors, cleared);
      return cleared;
    },
  };
}

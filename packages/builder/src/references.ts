import type { ShowCondition, StepRoute } from '@formhaus/core';
import { isPage, type BuilderForm } from './model';

export interface Renames {
  keys: Map<string, string>;
  values: Map<string, Map<string, string>>;
  steps: Map<string, string>;
}

type Scalar = string | number | boolean;

function renameCondition(condition: ShowCondition, renames: Renames): void {
  condition.field = renames.keys.get(condition.field) ?? condition.field;
  const values = renames.values.get(condition.field);
  if (!values) return;
  const map = <T extends Scalar>(value: T): T => (typeof value === 'string' ? ((values.get(value) ?? value) as T) : value);
  if (condition.eq !== undefined) condition.eq = map(condition.eq);
  if (condition.neq !== undefined) condition.neq = map(condition.neq);
  if (condition.in) condition.in = condition.in.map(map);
  if (condition.notIn) condition.notIn = condition.notIn.map(map);
}

function renameAll(list: ShowCondition[] | undefined, renames: Renames): void {
  for (const condition of list ?? []) renameCondition(condition, renames);
}

function renameRoutes(routes: StepRoute[] | undefined, renames: Renames): void {
  for (const route of routes ?? []) {
    if (route.to !== null) route.to = renames.steps.get(route.to) ?? route.to;
    renameAll(route.show, renames);
    renameAll(route.showAny, renames);
  }
}

const keep = (gone: Set<string>) => (condition: ShowCondition) => !gone.has(condition.field);

function prune(target: { show?: ShowCondition[]; showAny?: ShowCondition[] }, gone: Set<string>): void {
  for (const prop of ['show', 'showAny'] as const) {
    const list = target[prop]?.filter(keep(gone));
    if (list?.length) target[prop] = list;
    else delete target[prop];
  }
}

export function dropReferences(form: BuilderForm, keys: Set<string>): void {
  if (!keys.size) return;
  for (const block of form.blocks) {
    prune(block.extra, keys);
    if (isPage(block)) {
      if (block.routes) block.routes = block.routes.filter((route) => [...(route.show ?? []), ...(route.showAny ?? [])].every(keep(keys)));
      continue;
    }
    const validation = block.extra.validation;
    if (validation?.matchField && keys.has(validation.matchField)) delete validation.matchField;
  }
}

export function renameReferences(form: BuilderForm, renames: Renames): void {
  if (!renames.keys.size && !renames.values.size && !renames.steps.size) return;
  for (const block of form.blocks) {
    renameAll(block.extra.show, renames);
    renameAll(block.extra.showAny, renames);
    if (isPage(block)) {
      renameRoutes(block.routes, renames);
      continue;
    }
    const validation = block.extra.validation;
    if (validation?.matchField) validation.matchField = renames.keys.get(validation.matchField) ?? validation.matchField;
    if (block.extra.optionsDependsOn)
      block.extra.optionsDependsOn = block.extra.optionsDependsOn.map((key) => renames.keys.get(key) ?? key);
  }
}

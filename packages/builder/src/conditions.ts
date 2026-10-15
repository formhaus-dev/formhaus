import type { FieldType, ShowCondition } from '@formhaus/core';
import { hasOptions, isQuestion, type BuilderBlock, type BuilderForm, type BuilderQuestion } from './model';
import { blockIndex } from './ops/locate';
import { resolver, scopeOf } from './references';

export type Operator = 'eq' | 'neq' | 'in' | 'notIn' | 'notEmpty' | 'checked' | 'unchecked';
export type ConditionMode = 'always' | 'all' | 'any';
export type ConditionValue = string | string[];

export interface ConditionRow {
  field: string;
  operator: Operator;
  value: ConditionValue;
}

export interface Logic {
  mode: ConditionMode;
  rows: ConditionRow[];
  editable: boolean;
}

export const OPERATOR_LABELS: Record<Operator, string> = {
  eq: 'is',
  neq: 'is not',
  in: 'is any of',
  notIn: 'is none of',
  notEmpty: 'is answered',
  checked: 'is checked',
  unchecked: 'is unchecked',
};

const toggles = (type: FieldType) => type === 'checkbox' || type === 'switch';

export function operatorsFor(type: FieldType): Operator[] {
  if (toggles(type)) return ['checked', 'unchecked'];
  if (hasOptions(type)) return ['eq', 'neq', 'in', 'notIn', 'notEmpty'];
  return ['eq', 'neq', 'notEmpty'];
}

export const takesList = (operator: Operator) => operator === 'in' || operator === 'notIn';
export const takesValue = (operator: Operator) => operator !== 'notEmpty' && operator !== 'checked' && operator !== 'unchecked';

function scalar(value: ConditionValue, type: FieldType): string | number {
  const text = Array.isArray(value) ? (value[0] ?? '') : value;
  if (type !== 'number' || text.trim() === '') return text;
  const number = Number(text);
  return Number.isFinite(number) ? number : text;
}

const list = (value: ConditionValue) => (Array.isArray(value) ? value : value ? [value] : []);

export function toCondition(row: ConditionRow, type: FieldType): ShowCondition {
  switch (row.operator) {
    case 'checked':
      return { field: row.field, eq: true };
    case 'unchecked':
      return { field: row.field, eq: false };
    case 'notEmpty':
      return { field: row.field, notEmpty: true };
    case 'in':
    case 'notIn':
      return { field: row.field, [row.operator]: list(row.value) };
    default:
      return { field: row.field, [row.operator]: scalar(row.value, type) };
  }
}

export function fromCondition(condition: ShowCondition, type: FieldType | undefined): ConditionRow | undefined {
  const operators = Object.keys(condition).filter((key) => key !== 'field');
  if (operators.length !== 1 || !type) return undefined;
  const { field } = condition;
  if (typeof condition.eq === 'boolean')
    return toggles(type) ? { field, operator: condition.eq ? 'checked' : 'unchecked', value: '' } : undefined;
  if (condition.notEmpty === true) return { field, operator: 'notEmpty', value: '' };
  if (condition.eq !== undefined) return { field, operator: 'eq', value: String(condition.eq) };
  if (condition.neq !== undefined && typeof condition.neq !== 'boolean') return { field, operator: 'neq', value: String(condition.neq) };
  if (condition.in) return { field, operator: 'in', value: condition.in.map(String) };
  if (condition.notIn) return { field, operator: 'notIn', value: condition.notIn.map(String) };
  return undefined;
}

const questionByKey = (form: BuilderForm, key: string, scope?: string) => resolver(form).target(key, scope);

export interface ConditionHolder {
  show?: ShowCondition[];
  showAny?: ShowCondition[];
}

export function readLogic(form: BuilderForm, holder: ConditionHolder, scope?: string): Logic {
  const all = holder.show ?? [];
  const any = holder.showAny ?? [];
  if (!all.length && !any.length) return { mode: 'always', rows: [], editable: true };
  const source = all.length && any.length ? null : all.length ? all : any;
  const rows = (source ?? []).map((condition) => fromCondition(condition, questionByKey(form, condition.field, scope)?.type));
  const editable = !!source && rows.every((row) => row !== undefined);
  return { mode: any.length && !all.length ? 'any' : 'all', rows: editable ? (rows as ConditionRow[]) : [], editable };
}

export function writeLogic(form: BuilderForm, holder: ConditionHolder, mode: ConditionMode, rows: ConditionRow[], scope?: string): void {
  delete holder.show;
  delete holder.showAny;
  if (mode === 'always' || !rows.length) return;
  holder[mode === 'any' ? 'showAny' : 'show'] = rows.map((row) => toCondition(row, questionByKey(form, row.field, scope)?.type ?? 'text'));
}

export const logicOf = (form: BuilderForm, block: BuilderBlock) => readLogic(form, block.extra, scopeOf(form, block));

export function setLogic(form: BuilderForm, uid: string, mode: ConditionMode, rows: ConditionRow[]): void {
  const block = form.blocks.find((item) => item.uid === uid);
  if (block) writeLogic(form, block.extra, mode, rows, scopeOf(form, block));
}

export function conditionSources(form: BuilderForm, uid: string): BuilderQuestion[] {
  const index = blockIndex(form, uid);
  if (index < 0) return [];
  const { scope } = resolver(form);
  const own = scope(form.blocks[index]);
  return form.blocks
    .slice(0, index)
    .filter(isQuestion)
    .filter((item) => [undefined, own].includes(scope(item)));
}

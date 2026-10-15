import {
  OPERATOR_LABELS,
  resolver,
  takesValue,
  type BuilderForm,
  type BuilderQuestion,
  type ConditionRow,
  type Logic,
  type Resolver,
} from '@formhaus/builder';

const resolvers = new WeakMap<BuilderForm, Resolver>();

export function sourceOf(form: BuilderForm, key: string, scope?: string): BuilderQuestion | undefined {
  const known = resolvers.get(form) ?? resolvers.set(form, resolver(form)).get(form);
  return known?.target(key, scope);
}

function valueLabel(form: BuilderForm, row: ConditionRow, scope?: string): string {
  const options = sourceOf(form, row.field, scope)?.options ?? [];
  const values = Array.isArray(row.value) ? row.value : [row.value];
  return values.map((value) => options.find((option) => option.value === value)?.label.trim() || value).join(', ');
}

export function describeRow(form: BuilderForm, row: ConditionRow, scope?: string): string {
  const name = sourceOf(form, row.field, scope)?.label.trim() || row.field;
  const head = `${name} ${OPERATOR_LABELS[row.operator]}`;
  return takesValue(row.operator) ? `${head} ${valueLabel(form, row, scope) || '…'}` : head;
}

export function describeLogic(form: BuilderForm, logic: Logic, scope?: string): string | null {
  if (logic.mode === 'always') return null;
  if (!logic.editable) return 'Shown on custom conditions';
  return `Shown if ${logic.rows.map((row) => describeRow(form, row, scope)).join(logic.mode === 'any' ? ' or ' : ' and ')}`;
}

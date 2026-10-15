import {
  isQuestion,
  OPERATOR_LABELS,
  takesValue,
  type BuilderForm,
  type BuilderQuestion,
  type ConditionRow,
  type Logic,
} from '@formhaus/builder';

const sources = new WeakMap<BuilderForm, Map<string, BuilderQuestion>>();

export function sourceOf(form: BuilderForm, key: string): BuilderQuestion | undefined {
  let byKey = sources.get(form);
  if (!byKey) {
    byKey = new Map();
    for (const block of form.blocks) if (isQuestion(block) && !byKey.has(block.key)) byKey.set(block.key, block);
    sources.set(form, byKey);
  }
  return byKey.get(key);
}

function valueLabel(form: BuilderForm, row: ConditionRow): string {
  const options = sourceOf(form, row.field)?.options ?? [];
  const values = Array.isArray(row.value) ? row.value : [row.value];
  return values.map((value) => options.find((option) => option.value === value)?.label.trim() || value).join(', ');
}

export function describeRow(form: BuilderForm, row: ConditionRow): string {
  const name = sourceOf(form, row.field)?.label.trim() || row.field;
  const head = `${name} ${OPERATOR_LABELS[row.operator]}`;
  return takesValue(row.operator) ? `${head} ${valueLabel(form, row) || '…'}` : head;
}

export function describeLogic(form: BuilderForm, logic: Logic): string | null {
  if (logic.mode === 'always') return null;
  if (!logic.editable) return 'Shown on custom conditions';
  return `Shown if ${logic.rows.map((row) => describeRow(form, row)).join(logic.mode === 'any' ? ' or ' : ' and ')}`;
}

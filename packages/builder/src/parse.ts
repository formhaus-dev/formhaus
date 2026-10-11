import type { FormAction, FormDefinition, FormField, FormStep, StepRoute } from '@formhaus/core';
import { follows, keyBase, optionBase, stepBase } from './identifiers';
import { clone, hasOptions, newPage, uid, type BuilderBlock, type BuilderForm, type BuilderOption, type BuilderPage, type BuilderQuestion, type FormExtra } from './model';
import { toDefinition } from './serialize';

export interface ParseOptions {
  lockedFrom?: FormDefinition;
}

interface Locks {
  keys: Set<string>;
  values: Map<string, Set<string>>;
  steps: Set<string>;
}

function locksOf(definition: FormDefinition | undefined): Locks {
  const fields = [...(definition?.fields ?? []), ...(definition?.steps ?? []).flatMap((step) => step.fields ?? [])];
  return {
    keys: new Set(fields.map((field) => field.key)),
    values: new Map(fields.map((field) => [field.key, new Set((field.options ?? []).map((option) => option.value))])),
    steps: new Set((definition?.steps ?? []).map((step) => step.id)),
  };
}

function jumps(key: string, routes: StepRoute[], ids: Map<string, string>, options: { value: string }[]) {
  const shown = (value: string) => routes.find((item) => item.show?.length === 1 && item.show[0].field === key && item.show[0].eq === value)?.to;
  const fallback = routes.find((item) => !item.show?.length && !item.showAny?.length)?.to;
  const open = options.filter((option) => !shown(option.value));
  return (value: string) => {
    const to = shown(value) ?? (routes.some((item) => item.show?.[0]?.field === key) && open.length === 1 && open[0].value === value ? fallback : undefined);
    return to ? ids.get(to) ?? null : null;
  };
}

function question(form: BuilderForm, field: FormField, routes: StepRoute[], ids: Map<string, string>, locks: Locks): BuilderQuestion {
  const { key, type, label, options, validation, ...extra } = field;
  const { required, ...rules } = validation ?? {};
  if (typeof required === 'string') (rules as Record<string, unknown>).required = required;
  const choice = hasOptions(type);
  const jump = jumps(key, routes, ids, options ?? []);
  const published = locks.values.get(key);
  return {
    kind: 'question',
    uid: uid(form),
    label: label ?? '',
    type,
    required: !!required,
    options: (choice ? options ?? [] : []).map((option, index): BuilderOption => ({
      uid: uid(form),
      label: option.label,
      value: option.value,
      valueLocked: !!published?.has(option.value) || !follows(option.value, optionBase(option.label, index), '-'),
      jump: jump(option.value),
    })),
    key,
    keyLocked: locks.keys.has(key) || !follows(key, keyBase(label ?? '')),
    extra: { ...extra, ...(!choice && options ? { options } : {}), ...(Object.keys(rules).length ? { validation: rules } : {}) },
  };
}

const labelOnly = (action: FormStep['next']) => (typeof action === 'object' && action && Object.keys(action).length === 1 ? action.label : undefined);

function page(form: BuilderForm, step: FormStep, index: number, locks: Locks): BuilderPage {
  const { id, title, fields: _fields, routes: _routes, next, back, ...rest } = step;
  const extra: Partial<FormStep> = { ...rest };
  if (next !== undefined && labelOnly(next) === undefined) extra.next = next;
  if (back !== undefined && labelOnly(back) === undefined) extra.back = back;
  const result: BuilderPage = { ...newPage(form, title ?? ''), nextLabel: labelOnly(next) ?? '', backLabel: labelOnly(back) ?? '', extra, id };
  result.idLocked = locks.steps.has(id) || !follows(id, stepBase(result, index), '-');
  return result;
}

function head(definition: FormDefinition): Omit<BuilderForm, 'blocks'> {
  const { id, title, submit, fields: _fields, steps: _steps, ...rest } = definition;
  const { label, ...action } = (submit ?? {}) as Partial<FormAction>;
  const extra: FormExtra = { ...rest, ...(Object.keys(action).length ? { submit: action } : {}) };
  return { id, title: title ?? '', submit: label ?? 'Submit', extra, seq: 0 };
}

export function fromDefinition(source: FormDefinition, options: ParseOptions = {}): BuilderForm {
  const definition = clone(source);
  const locks = locksOf(options.lockedFrom);
  const form: BuilderForm = { ...head(definition), blocks: [] };
  if (!definition.steps) {
    form.blocks = (definition.fields ?? []).map((field) => question(form, field, [], new Map(), locks));
    return form;
  }
  const steps = definition.steps;
  const pages = steps.map((step, index) => page(form, step, index, locks));
  const ids = new Map(steps.map((step, index) => [step.id, pages[index].uid]));
  form.blocks = steps.flatMap((step, index): BuilderBlock[] => {
    const questions = (step.fields ?? []).map((field) => question(form, field, step.routes ?? [], ids, locks));
    const fallback = step.routes?.find((item) => !item.show?.length && !item.showAny?.length)?.to;
    const claimed = questions.some((item) => item.options.some((option) => option.jump === (fallback && ids.get(fallback))));
    if (fallback && fallback !== steps[index + 1]?.id && !claimed) pages[index].next = ids.get(fallback) ?? null;
    return [pages[index], ...questions];
  });
  const generated = toDefinition(form).steps ?? [];
  steps.forEach((step, index) => {
    if (JSON.stringify(step.routes) !== JSON.stringify(generated[index]?.routes)) pages[index].routes = step.routes;
  });
  return form;
}

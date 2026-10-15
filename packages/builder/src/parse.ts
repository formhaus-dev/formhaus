import type { FormAction, FormDefinition, FormField, FormStep, StepRoute } from '@formhaus/core';
import { follows, keyBase, optionBase, stepBase } from './identifiers';
import { clone, END, hasOptions, newPage, uid, type BuilderBlock, type BuilderForm, type BuilderOption, type BuilderPage, type BuilderQuestion, type FormExtra } from './model';
import { toDefinition } from './serialize';

export interface ParseOptions {
  lockedFrom?: FormDefinition;
}

interface Locks {
  keys: Set<string>;
  values: Map<string, Set<string>>;
  steps: Set<string>;
}

function locksOf(...definitions: (FormDefinition | undefined)[]): Locks {
  const locks: Locks = { keys: new Set(), values: new Map(), steps: new Set() };
  for (const definition of definitions) {
    for (const step of definition?.steps ?? []) locks.steps.add(step.id);
    for (const field of [...(definition?.fields ?? []), ...(definition?.steps ?? []).flatMap((step) => step.fields ?? [])]) {
      locks.keys.add(field.key);
      const values = locks.values.get(field.key) ?? new Set();
      for (const option of field.options ?? []) values.add(option.value);
      locks.values.set(field.key, values);
    }
  }
  return locks;
}

function canonical(value: unknown): string {
  if (Array.isArray(value)) return `[${value.map(canonical).join(',')}]`;
  if (value && typeof value === 'object') {
    const entries = Object.entries(value).filter(([, item]) => item !== undefined).sort(([a], [b]) => a.localeCompare(b));
    return `{${entries.map(([key, item]) => `${JSON.stringify(key)}:${canonical(item)}`).join(',')}}`;
  }
  return JSON.stringify(value) ?? 'undefined';
}

const fallbackOf = (routes: StepRoute[] | undefined) => routes?.find((item) => !item.show?.length && !item.showAny?.length);

function target(to: string | null | undefined, ids: Map<string, string>): string | null {
  if (to === null) return END;
  return to ? ids.get(to) ?? null : null;
}

function jumps(key: string, routes: StepRoute[], ids: Map<string, string>, options: { value: string }[]) {
  const match = (value: string) => routes.find((item) => item.show?.length === 1 && item.show[0].field === key && item.show[0].eq === value);
  const fallback = fallbackOf(routes);
  const open = options.filter((option) => !match(option.value));
  const branching = routes.some((item) => item.show?.[0]?.field === key);
  return (value: string) => {
    const own = match(value);
    if (own) return target(own.to, ids);
    return fallback && branching && open.length === 1 && open[0].value === value ? target(fallback.to, ids) : null;
  };
}

function question(form: BuilderForm, field: FormField, routes: StepRoute[], ids: Map<string, string>, locks: Locks): BuilderQuestion {
  const { key, type, label, options, validation, ...extra } = field;
  const { required, ...rules } = validation ?? {};
  if (typeof required === 'string' || required === false) (rules as Record<string, unknown>).required = required;
  const choice = hasOptions(type);
  const jump = jumps(key, routes, ids, options ?? []);
  const published = locks.values.get(key);
  return {
    kind: 'question',
    uid: uid(form),
    label: label ?? '',
    type,
    required: !!required,
    options: (choice ? options ?? [] : []).map((option, index): BuilderOption => {
      const { value, label: text, ...meta } = option;
      return {
        uid: uid(form),
        label: text,
        value,
        valueLocked: !!published?.has(value) || !!meta.i18n || !follows(value, optionBase(text, index), '-'),
        jump: jump(value),
        ...(Object.keys(meta).length ? { extra: meta } : {}),
        shape: Object.keys(option),
      };
    }),
    key,
    keyLocked: locks.keys.has(key) || !!extra.i18n || !follows(key, keyBase(label ?? '')),
    extra: { ...extra, ...(!choice && options ? { options } : {}), ...(Object.keys(rules).length ? { validation: rules } : {}) },
    shape: { field: Object.keys(field), ...(validation ? { validation: Object.keys(validation) } : {}) },
  };
}

const labelOnly = (action: FormStep['next']) => (
  typeof action === 'object' && action && Object.keys(action).length === 1 && action.label && action.label.trim() === action.label ? action.label : undefined
);

function page(form: BuilderForm, step: FormStep, index: number, locks: Locks): BuilderPage {
  const { id, title, fields: _fields, routes: _routes, next, back, ...rest } = step;
  const extra: Partial<FormStep> = { ...rest };
  if (next !== undefined && labelOnly(next) === undefined) extra.next = next;
  if (back !== undefined && labelOnly(back) === undefined) extra.back = back;
  const result: BuilderPage = { ...newPage(form, title ?? ''), nextLabel: labelOnly(next) ?? '', backLabel: labelOnly(back) ?? '', extra, id, shape: Object.keys(step) };
  result.idLocked = locks.steps.has(id) || !!step.i18n || !follows(id, stepBase(result, index), '-');
  return result;
}

function head(definition: FormDefinition): Omit<BuilderForm, 'blocks'> {
  const { id, title, submit, fields: _fields, steps: _steps, ...rest } = definition;
  const { label, ...action } = (submit ?? {}) as Partial<FormAction>;
  const extra: FormExtra = { ...rest, ...(Object.keys(action).length ? { submit: action } : {}) };
  const shape = { form: Object.keys(definition), ...(submit ? { submit: Object.keys(submit) } : {}) };
  return { id, title: title ?? '', submit: label ?? 'Submit', extra, seq: 0, shape };
}

export function fromDefinition(source: FormDefinition, options: ParseOptions = {}): BuilderForm {
  const definition = clone(source);
  const locks = locksOf(options.lockedFrom, source.lang || source.i18n ? source : undefined);
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
    const fallback = fallbackOf(step.routes);
    const to = fallback && target(fallback.to, ids);
    const claimed = questions.some((item) => item.options.some((option) => option.jump === to));
    if (fallback && fallback.to !== steps[index + 1]?.id && !claimed) pages[index].next = to ?? null;
    return [pages[index], ...questions];
  });
  const generated = toDefinition(form).steps ?? [];
  steps.forEach((step, index) => {
    if (canonical(step.routes) !== canonical(generated[index]?.routes)) pages[index].routes = step.routes;
  });
  return form;
}

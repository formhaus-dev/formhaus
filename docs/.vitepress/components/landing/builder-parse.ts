import type { FormDefinition, FormField, FormStep, StepRoute } from '@formhaus/core';
import {
  keyFromLabel, newPage, toDefinition, uid, words,
  type BuilderBlock, type BuilderForm, type BuilderOption, type BuilderPage, type BuilderQuestion,
} from './builder-model';

function question(field: FormField, routes: StepRoute[], ids: Map<string, string>): BuilderQuestion {
  const { key, type, label, options, validation, ...extra } = field;
  const { required, ...rules } = validation ?? {};
  if (typeof required === 'string') (rules as Record<string, unknown>).required = required;
  const shown = (value: string) => routes.find((item) => item.show?.length === 1 && item.show[0].field === key && item.show[0].eq === value)?.to;
  const fallback = routes.find((item) => !item.show?.length && !item.showAny?.length)?.to;
  const open = (options ?? []).filter((option) => !shown(option.value));
  const jump = (value: string) => {
    const to = shown(value) ?? (routes.some((item) => item.show?.[0]?.field === key) && open.length === 1 && open[0].value === value ? fallback : undefined);
    return to ? ids.get(to) ?? null : null;
  };
  const result: BuilderQuestion = {
    kind: 'question',
    uid: uid(),
    label: label ?? '',
    type,
    required: !!required,
    options: (options ?? []).map((option) => {
      const own: BuilderOption = { uid: uid(), label: option.label, jump: jump(option.value) };
      if (option.value !== words(option.label).join('-')) own.value = option.value;
      return own;
    }),
    extra: { ...extra, ...(Object.keys(rules).length ? { validation: rules } : {}) },
  };
  if (key !== keyFromLabel(label ?? '', new Set())) result.key = key;
  return result;
}

export function fromDefinition(definition: FormDefinition): BuilderForm {
  const base = { id: definition.id, title: definition.title ?? '', submit: definition.submit?.label ?? 'Submit' };
  if (!definition.steps) return { ...base, blocks: (definition.fields ?? []).map((field) => question(field, [], new Map())) };
  const steps = definition.steps;
  const labelOnly = (action: FormStep['next']) => (typeof action === 'object' && action && Object.keys(action).length === 1 ? action.label : undefined);
  const pages = steps.map((step) => {
    const { id, title, fields: _fields, routes: _routes, next, back, ...rest } = step;
    const extra: Partial<FormStep> = { ...rest };
    if (next !== undefined && labelOnly(next) === undefined) extra.next = next;
    if (back !== undefined && labelOnly(back) === undefined) extra.back = back;
    const page: BuilderPage = { ...newPage(title ?? id), nextLabel: labelOnly(next) ?? '', backLabel: labelOnly(back) ?? '', extra };
    if (id !== words(title ?? '').join('-')) page.id = id;
    return page;
  });
  const ids = new Map(steps.map((step, index) => [step.id, pages[index].uid]));
  const blocks = steps.flatMap((step, index): BuilderBlock[] => {
    const questions = step.fields.map((field) => question(field, step.routes ?? [], ids));
    const fallback = step.routes?.find((item) => !item.show?.length && !item.showAny?.length)?.to;
    const claimed = questions.some((item) => item.options.some((option) => option.jump === (fallback && ids.get(fallback))));
    if (fallback && fallback !== steps[index + 1]?.id && !claimed) pages[index].next = ids.get(fallback) ?? null;
    return [pages[index], ...questions];
  });
  const form = { ...base, blocks };
  const generated = toDefinition(form).steps ?? [];
  steps.forEach((step, index) => {
    if (JSON.stringify(step.routes) !== JSON.stringify(generated[index]?.routes)) pages[index].routes = step.routes;
  });
  return form;
}

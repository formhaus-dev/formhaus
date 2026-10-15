import type { FormDefinition, FormField, FormStep, StepRoute } from '@formhaus/core';
import {
  arrange,
  canBranch,
  END,
  groups,
  hasOptions,
  isPage,
  pageTitle,
  type BuilderForm,
  type BuilderPage,
  type BuilderQuestion,
  type Group,
} from './model';

export interface Serialized {
  definition: FormDefinition;
  paths: Map<string, string>;
}

function field(item: BuilderQuestion, path: string, paths: Map<string, string>): FormField {
  const { validation, ...extra } = item.extra;
  const { required, ...rules } = validation ?? {};
  const shape = item.shape;
  const label = item.label || !shape || shape.field.includes('label') ? { label: item.label } : {};
  const result = { key: item.key, type: item.type, ...label, ...extra } as FormField;
  const own = item.required
    ? typeof required === 'string' && required
      ? required
      : true
    : required === false || required === ''
      ? required
      : undefined;
  const merged = arrange({ ...(own !== undefined ? { required: own } : {}), ...rules }, shape?.validation);
  if (Object.keys(merged).length || shape?.validation?.length === 0) result.validation = merged;
  paths.set(path, item.uid);
  if (hasOptions(item.type) && (item.options.length || !item.extra.optionsFrom || shape?.field.includes('options'))) {
    result.options = item.options.map((option, index) => {
      paths.set(`${path}.options.${index}`, option.uid);
      return arrange({ value: option.value, label: option.label, ...option.extra }, option.shape);
    });
  }
  return arrange(result, shape?.field);
}

function routesFor(parts: Group[], ids: string[], fields: FormField[][]): StepRoute[][] {
  const routes: StepRoute[][] = parts.map(() => []);
  parts.forEach((part, index) => {
    const resolve = (uid: string | null): { to: string | null } | undefined => {
      if (uid === END) return { to: null };
      const at = parts.findIndex((other, position) => position > index && other.page?.uid === uid);
      return at >= 0 ? { to: ids[at] } : undefined;
    };
    const branching = part.questions.filter((item) => canBranch(item.type) && item.options.some((option) => resolve(option.jump)));
    for (const item of branching) {
      const key = fields[index][part.questions.indexOf(item)].key;
      item.options.forEach((option, at) => {
        const target = resolve(option.jump);
        const value = fields[index][part.questions.indexOf(item)].options![at].value;
        if (target) routes[index].push({ to: target.to, show: [{ field: key, eq: value }] });
      });
    }
    const covered = branching.length === 1 && branching[0].options.every((option) => resolve(option.jump));
    const next = resolve(part.page?.next ?? null);
    if (covered) delete routes[index][routes[index].length - 1].show;
    else if (next) routes[index].push({ to: next.to });
    else if (routes[index].length && index + 1 < parts.length) routes[index].push({ to: ids[index + 1] });
  });
  return routes;
}

function head(form: BuilderForm) {
  const { $schema, submit, ...extra } = form.extra;
  const shape = form.shape;
  const label = form.submit !== 'Submit' || !shape || shape.submit?.includes('label') ? { label: form.submit } : {};
  const action = arrange({ ...submit, ...label }, shape?.submit);
  return {
    ...($schema ? { $schema } : {}),
    id: form.id,
    ...(form.title || !shape || shape.form.includes('title') ? { title: form.title } : {}),
    ...extra,
    ...(Object.keys(action).length || !shape || shape.form.includes('submit') ? { submit: action } : {}),
  };
}

function stepTitle(page: BuilderPage | undefined, index: number): { title?: string } {
  if (page?.title.trim()) return { title: page.title };
  return page?.shape && !page.shape.includes('title') ? {} : { title: pageTitle(page, index) };
}

export function serialize(form: BuilderForm): Serialized {
  const paths = new Map<string, string>();
  const parts = groups(form);
  if (!form.blocks.some(isPage)) {
    const fields = (parts[0]?.questions ?? []).map((item, index) => field(item, `fields.${index}`, paths));
    return { definition: arrange({ ...head(form), fields }, form.shape?.form) as FormDefinition, paths };
  }
  const ids = parts.map((part, index) => part.page?.id || `step-${index + 1}`);
  const fields = parts.map((part, step) => part.questions.map((item, index) => field(item, `steps.${step}.fields.${index}`, paths)));
  const routes = routesFor(parts, ids, fields);
  const steps = parts.map((part, index): FormStep => {
    if (part.page) paths.set(`steps.${index}`, part.page.uid);
    const next = part.page?.nextLabel.trim();
    const back = part.page?.backLabel.trim();
    const step = {
      id: ids[index],
      ...stepTitle(part.page, index),
      ...part.page?.extra,
      ...(next ? { next: { label: next } } : {}),
      ...(back ? { back: { label: back } } : {}),
      fields: fields[index],
    } as FormStep;
    const own = part.page?.routes ?? routes[index];
    if (own.length || part.page?.routes) step.routes = own;
    return arrange(step, part.page?.shape);
  });
  return { definition: arrange({ ...head(form), steps }, form.shape?.form) as FormDefinition, paths };
}

export const toDefinition = (form: BuilderForm): FormDefinition => serialize(form).definition;

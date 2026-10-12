import type { StepRoute } from '@formhaus/core';
import { isPage, type BuilderForm } from '../model';
import { serialize } from '../serialize';
import { blockIndex, findStep, stepFields } from './locate';

export interface StepTarget {
  id: string;
  title: string;
}

export function stepTargetsAfter(form: BuilderForm, uid: string): StepTarget[] {
  const steps = serialize(form).definition.steps ?? [];
  const position = form.blocks.filter(isPage).findIndex((page) => page.uid === uid);
  return position < 0 ? [] : steps.slice(position + 1).map((step) => ({ id: step.id, title: step.title }));
}

export function routesOf(form: BuilderForm, uid: string): StepRoute[] {
  const page = findStep(form, uid);
  if (!page) return [];
  if (page.routes) return page.routes;
  const position = form.blocks.filter(isPage).findIndex((item) => item.uid === uid);
  return serialize(form).definition.steps?.[position]?.routes ?? [];
}

export const hasCustomRoutes = (form: BuilderForm, uid: string) => !!findStep(form, uid)?.routes;

export function setRoutes(form: BuilderForm, uid: string, routes: StepRoute[] | undefined): void {
  const page = findStep(form, uid);
  if (!page || blockIndex(form, uid) < 0) return;
  if (routes === undefined) {
    delete page.routes;
    return;
  }
  page.routes = routes;
  page.next = null;
  for (const field of stepFields(form, uid)) for (const option of field.options) option.jump = null;
}

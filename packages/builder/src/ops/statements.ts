import type { FormField } from '@formhaus/core';
import { syncIdentifiers } from '../identifiers';
import type { BuilderBlock, BuilderForm } from '../model';
import { addField, type Placement } from './fields';
import { addStep, addStepFirst } from './steps';
import { childrenOf } from './locate';

export interface StatementText {
  title: string;
  description?: string;
  next?: string;
}

export type StatementPlacement = Placement | { page: string | null };

export function addStatement(form: BuilderForm, at: StatementPlacement, text: StatementText): BuilderBlock {
  const description = text.description?.trim() ? { description: text.description } : {};
  if ('page' in at) {
    const page = at.page === null ? addStepFirst(form) : addStep(form, at.page);
    page.title = text.title;
    page.nextLabel = text.next ?? '';
    Object.assign(page.extra, description);
    syncIdentifiers(form);
    return page;
  }
  const section = addField(form, at, { type: 'section', label: text.title, extra: description as Partial<FormField> });
  const [child] = childrenOf(form, section.uid);
  if (child) form.blocks.splice(form.blocks.indexOf(child), 1);
  return section;
}

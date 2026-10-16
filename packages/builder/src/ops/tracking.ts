import type { FieldSource } from '@formhaus/core';
import { isQuestion, type BuilderForm } from '../model';
import { addField, type Placement } from './fields';
import { findField } from './locate';

export const TRACKING_FIELDS: { key: string; label: string; source: FieldSource }[] = [
  { key: 'utm_source', label: 'UTM source', source: { query: 'utm_source' } },
  { key: 'utm_medium', label: 'UTM medium', source: { query: 'utm_medium' } },
  { key: 'utm_campaign', label: 'UTM campaign', source: { query: 'utm_campaign' } },
  { key: 'utm_term', label: 'UTM term', source: { query: 'utm_term' } },
  { key: 'utm_content', label: 'UTM content', source: { query: 'utm_content' } },
  { key: 'referrer', label: 'Referrer', source: 'referrer' },
];

const sameSource = (a: FieldSource | undefined, b: FieldSource) =>
  typeof b === 'string' ? a === b : typeof a === 'object' && a.query === b.query;

function outsideGroups(form: BuilderForm, at: Placement): Placement {
  if ('step' in at) return at;
  let item = 'inside' in at ? findField(form, at.inside) : findField(form, findField(form, at.after)?.parent ?? '');
  let group: string | undefined;
  while (item) {
    if (item.type === 'group') group = item.uid;
    item = findField(form, item.parent ?? '');
  }
  return group ? { after: group } : at;
}

export function addTrackingFields(form: BuilderForm, at: Placement): string[] {
  const questions = form.blocks.filter(isQuestion);
  const missing = TRACKING_FIELDS.filter(
    ({ key, source }) => !questions.some((item) => item.key === key || sameSource(item.extra.source, source)),
  );
  const added: string[] = [];
  let place = outsideGroups(form, at);
  for (const { key, label, source } of missing) {
    const question = addField(form, place, { type: 'hidden', label, key, extra: { source } });
    added.push(question.uid);
    place = { after: question.uid };
  }
  return added;
}

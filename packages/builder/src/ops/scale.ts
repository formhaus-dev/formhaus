import type { FieldOption } from '@formhaus/core';
import type { BuilderQuestion, BuilderForm } from '../model';
import { findField } from './locate';

export type AnchorSlot = 'start' | 'middle' | 'end';
export type Anchors = Record<AnchorSlot, string>;

export const SCALE_POINTS = { min: 3, max: 11 };
export const RATING_STARS = { min: 3, max: 10 };

export function scaleRange(question: Pick<BuilderQuestion, 'type' | 'extra'>): [number, number] {
  const rules = question.extra.validation ?? {};
  return [question.type === 'rating' ? 1 : (rules.min ?? 1), rules.max ?? 5];
}

export function scalePoints(question: Pick<BuilderQuestion, 'type' | 'extra'>): number[] {
  const [min, max] = scaleRange(question);
  return max >= min && max - min <= 20 ? Array.from({ length: max - min + 1 }, (_, index) => min + index) : [];
}

const middleOf = (min: number, max: number) => Math.floor((min + max) / 2);

export function anchorsOf(question: Pick<BuilderQuestion, 'type' | 'extra'>): Anchors {
  const [min, max] = scaleRange(question);
  const list = question.extra.options ?? [];
  const label = (point: number) => list.find((option) => option.value === String(point))?.label ?? '';
  return { start: label(min), middle: max - min > 1 ? label(middleOf(min, max)) : '', end: label(max) };
}

function writeAnchors(question: BuilderQuestion, anchors: Anchors, [min, max]: [number, number]): void {
  const points: [AnchorSlot, number][] = [
    ['start', min],
    ['middle', middleOf(min, max)],
    ['end', max],
  ];
  const options: FieldOption[] = points
    .filter(([slot, point]) => anchors[slot].trim() && (slot !== 'middle' || (point > min && point < max)))
    .map(([slot, point]) => ({ value: String(point), label: anchors[slot] }));
  if (options.length) question.extra.options = options;
  else delete question.extra.options;
}

export function setAnchor(form: BuilderForm, uid: string, slot: AnchorSlot, label: string): void {
  const question = findField(form, uid);
  if (!question) return;
  writeAnchors(question, { ...anchorsOf(question), [slot]: label }, scaleRange(question));
}

export function setScaleRange(form: BuilderForm, uid: string, range: { min?: number; max?: number }): void {
  const question = findField(form, uid);
  if (!question) return;
  const anchors = anchorsOf(question);
  const rules = { ...question.extra.validation };
  for (const bound of ['min', 'max'] as const) {
    if (!(bound in range)) continue;
    const value = range[bound];
    if (value === undefined) delete rules[bound];
    else rules[bound] = value;
  }
  if (Object.keys(rules).length) question.extra.validation = rules;
  else delete question.extra.validation;
  writeAnchors(question, anchors, scaleRange(question));
}

import type { FieldOption } from '@formhaus/core';
import type { BuilderForm, BuilderQuestion } from '../model';
import { findField } from './locate';

export type AnchorSlot = 'start' | 'middle' | 'end';
export type Anchors = Record<AnchorSlot, string>;

type Scale = Pick<BuilderQuestion, 'type' | 'extra'>;
type Range = [number, number];

export const SCALE_POINTS = { min: 3, max: 11 };
export const RATING_STARS = { min: 3, max: 10 };

const SLOTS: AnchorSlot[] = ['start', 'middle', 'end'];

export function scaleRange(question: Scale): Range {
  const rules = question.extra.validation ?? {};
  return [question.type === 'rating' ? 1 : (rules.min ?? 1), rules.max ?? 5];
}

const valid = ([min, max]: Range) => Number.isInteger(min) && Number.isInteger(max) && max - min >= 2 && max - min <= 20;

export function scalePoints(question: Scale): number[] {
  const [min, max] = scaleRange(question);
  return max >= min && max - min <= 20 ? Array.from({ length: max - min + 1 }, (_, index) => min + index) : [];
}

function slotPoints([min, max]: Range): Record<AnchorSlot, number | undefined> {
  const middle = Math.floor((min + max) / 2);
  return { start: min, middle: middle > min && middle < max ? middle : undefined, end: max };
}

const labels = (question: Scale) => new Map((question.extra.options ?? []).map((option) => [Number(option.value), option.label]));

export function anchorsOf(question: Scale): Anchors {
  const points = slotPoints(scaleRange(question));
  const known = labels(question);
  const label = (slot: AnchorSlot) => {
    const point = points[slot];
    return point === undefined ? '' : (known.get(point) ?? '');
  };
  return { start: label('start'), middle: label('middle'), end: label('end') };
}

function guessRoles(question: Scale, [min]: Range): Map<number, AnchorSlot> {
  const values = [...labels(question).keys()].sort((a, b) => a - b);
  const roles = new Map<number, AnchorSlot>();
  if (values.length === 1) return roles.set(values[0], values[0] === min ? 'start' : 'end');
  roles.set(values[0], 'start').set(values[values.length - 1], 'end');
  if (values.length === 3) roles.set(values[1], 'middle');
  return roles;
}

function rolesOf(question: Scale, range: Range): Map<number, AnchorSlot> {
  if (labels(question).size > SLOTS.length) return new Map();
  if (!valid(range)) return guessRoles(question, range);
  const points = slotPoints(range);
  return new Map(SLOTS.flatMap((slot): [number, AnchorSlot][] => (points[slot] === undefined ? [] : [[points[slot], slot]])));
}

function write(question: BuilderQuestion, points: Map<number, string>): void {
  const options: FieldOption[] = [...points]
    .filter(([, label]) => label.trim())
    .sort(([a], [b]) => a - b)
    .map(([point, label]) => ({ value: String(point), label }));
  if (options.length) question.extra.options = options;
  else delete question.extra.options;
}

export function setAnchor(form: BuilderForm, uid: string, slot: AnchorSlot, label: string): void {
  const question = findField(form, uid);
  const point = question && slotPoints(scaleRange(question))[slot];
  if (!question || point === undefined || !valid(scaleRange(question))) return;
  const points = labels(question);
  points.set(point, label);
  write(question, points);
}

export function setScaleRange(form: BuilderForm, uid: string, range: { min?: number; max?: number }): void {
  const question = findField(form, uid);
  if (!question) return;
  const before = scaleRange(question);
  const known = labels(question);
  const rules = { ...question.extra.validation };
  for (const bound of ['min', 'max'] as const) {
    if (!(bound in range)) continue;
    const value = range[bound];
    if (value === undefined) delete rules[bound];
    else rules[bound] = value;
  }
  if (Object.keys(rules).length) question.extra.validation = rules;
  else delete question.extra.validation;
  const after = scaleRange(question);
  if (!valid(after)) return;
  const roles = rolesOf(question, before);
  const targets = slotPoints(after);
  const taken = new Set([...roles.values()].map((slot) => targets[slot]));
  const points = new Map<number, string>();
  for (const [point, label] of known) {
    const role = roles.get(point);
    const target = role ? targets[role] : taken.has(point) ? undefined : point;
    if (target !== undefined && target >= after[0] && target <= after[1] && !points.has(target)) points.set(target, label);
  }
  write(question, points);
}

import { isEntry } from '../visibility/nodes';
import type { StaticAction } from './types';

type Values = Record<string, unknown>;

const MAX_LIST = 1000;

const primitive = (value: unknown): boolean => value === null || ['string', 'number', 'boolean'].includes(typeof value);

const plain = (value: unknown): boolean => primitive(value) || (Array.isArray(value) && value.length <= MAX_LIST && value.every(primitive));

export function plainValues(values: unknown): Values {
  const kept: Values = {};
  if (isEntry(values)) for (const key of Object.keys(values)) if (key !== '__proto__' && plain(values[key])) kept[key] = values[key];
  return kept;
}

export function plainErrors(errors: unknown): Record<string, string> {
  const kept: Record<string, string> = {};
  if (isEntry(errors))
    for (const key of Object.keys(errors)) if (typeof errors[key] === 'string' && key !== '__proto__') kept[key] = errors[key] as string;
  return kept;
}

export function plainActions(actions: unknown): StaticAction[] {
  if (!Array.isArray(actions)) return [];
  return actions.filter(
    (action): action is StaticAction =>
      isEntry(action) &&
      typeof action.label === 'string' &&
      action.label.trim() !== '' &&
      typeof action.name === 'string' &&
      action.name.trim() !== '' &&
      typeof action.value === 'string',
  );
}

export const plainTexts = (texts: unknown): string[] => (Array.isArray(texts) ? texts.filter((text) => typeof text === 'string') : []);

import type { QuestionType } from './model';

const RULES: [RegExp, QuestionType][] = [
  [/\be-?mail\b/i, 'email'],
  [/\b(phone|mobile|tel)\b/i, 'phone'],
  [/\b(how many|how much|age|number of|quantity|count|amount)\b/i, 'number'],
  [/\b(date|when|birthday)\b/i, 'date'],
  [/\b(describe|tell us|comments?|feedback|why|details|message|anything else)\b/i, 'textarea'],
  [/\b(which|choose|pick|select|prefer)\b/i, 'radio'],
];

export function inferType(label: string): QuestionType | undefined {
  return RULES.find(([pattern]) => pattern.test(label))?.[1];
}

export type Shortcut = { kind: 'options'; type: 'radio' | 'multiselect' } | { kind: 'page' } | { kind: 'branch' };

export function shortcut(value: string): Shortcut | undefined {
  if (/^[-*] $/.test(value)) return { kind: 'options', type: 'radio' };
  if (/^\[ ?\] $/.test(value)) return { kind: 'options', type: 'multiselect' };
  if (/^# $/.test(value)) return { kind: 'page' };
  return undefined;
}

export function splitLines(text: string): string[] {
  return text
    .split(/\r?\n/)
    .map((line) => line.replace(/^\s*(?:[-*•]|\d+[.)])\s+/, '').trim())
    .filter(Boolean);
}

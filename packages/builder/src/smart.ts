import { PAGE_ITEM, TYPE_ITEMS, type MenuItem, type QuestionType } from './model';

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

export const BRANCH_ITEM: MenuItem = { id: 'branch', label: 'Branch this answer', hint: 'Jump to a step when picked', icon: 'split' };
export const UNBRANCH_ITEM: MenuItem = { id: 'unbranch', label: 'Remove branch', hint: 'Follow the step order', icon: 'x' };

export function slashQuery(value: string): string | null {
  return value.startsWith('/') ? value.slice(1) : null;
}

export function filterItems<T extends { label: string; hint?: string }>(items: T[], query: string): T[] {
  const needle = query.trim().toLowerCase();
  if (!needle) return items;
  return items.filter((item) => `${item.label} ${item.hint ?? ''}`.toLowerCase().includes(needle));
}

export const questionSlash = (query: string) => filterItems([...TYPE_ITEMS, PAGE_ITEM], query);

export type Shortcut = { kind: 'options'; type: 'radio' | 'multiselect' } | { kind: 'page' } | { kind: 'branch' };

export function shortcut(value: string): Shortcut | undefined {
  if (/^[-*] $/.test(value)) return { kind: 'options', type: 'radio' };
  if (/^\[ ?\] $/.test(value)) return { kind: 'options', type: 'multiselect' };
  if (/^# $/.test(value)) return { kind: 'page' };
  return undefined;
}

export function branchShortcut(value: string): string | undefined {
  const match = value.match(/\s*(->|→)\s*$/);
  return match ? value.slice(0, match.index) : undefined;
}

export function splitLines(text: string): string[] {
  return text.split(/\r?\n/).map((line) => line.replace(/^\s*(?:[-*•]|\d+[.)])\s+/, '').trim()).filter(Boolean);
}

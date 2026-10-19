import type { RuleName } from '@formhaus/builder';
import type { FieldValidation } from '@formhaus/core';

type Bound = 'min' | 'max' | 'minLength' | 'maxLength';
type Message = 'minMessage' | 'maxMessage' | 'minLengthMessage' | 'maxLengthMessage';

export interface LimitSide {
  rule: Bound;
  message: Message;
  label: string;
  messageLabel: string;
  fallback: (value: number) => string;
}

export interface LimitSpec {
  whole: boolean;
  pattern: boolean;
  low: LimitSide;
  high: LimitSide;
}

const side = (rule: Bound, label: string, messageLabel: string, fallback: (value: number) => string): LimitSide => ({
  rule,
  message: `${rule}Message` as Message,
  label,
  messageLabel,
  fallback,
});

const characters: LimitSpec = {
  whole: true,
  pattern: true,
  low: side('minLength', 'Min characters', 'Error if too short', (value) => `Minimum length is ${String(value)}`),
  high: side('maxLength', 'Max characters', 'Error if too long', (value) => `Maximum length is ${String(value)}`),
};

const SPECS: Record<string, LimitSpec> = {
  number: {
    whole: false,
    pattern: false,
    low: side('min', 'Minimum', 'Error if too low', (value) => `Must be at least ${String(value)}`),
    high: side('max', 'Maximum', 'Error if too high', (value) => `Must be at most ${String(value)}`),
  },
  text: characters,
  textarea: characters,
  multiselect: {
    whole: true,
    pattern: false,
    low: side('minLength', 'Min selections', 'Error if too few', (value) => `At least ${String(value)} required`),
    high: side('maxLength', 'Max selections', 'Error if too many', (value) => `At most ${String(value)} allowed`),
  },
};

export const limitSpec = (type: string): LimitSpec | undefined => SPECS[type];

function decimalMark(): string {
  return new Intl.NumberFormat().formatToParts(1.1).find((part) => part.type === 'decimal')?.value ?? '.';
}

function normalize(text: string, mark: string): string {
  const commas = text.split(',').length - 1;
  const dots = text.split('.').length - 1;
  if (commas && dots)
    return text.lastIndexOf(',') > text.lastIndexOf('.') ? text.replaceAll('.', '').replace(',', '.') : text.replaceAll(',', '');
  if (commas > 1 || dots > 1) return text.replaceAll(commas > 1 ? ',' : '.', '');
  if (commas && mark === '.' && /,\d{3}$/.test(text)) return text.replace(',', '');
  if (dots && mark === ',' && /\.\d{3}$/.test(text)) return text.replace('.', '');
  return text.replace(',', '.');
}

export function parseNumber(text: string, mark = decimalMark()): number | null | undefined {
  const compact = text.replace(/[\s'’]/g, '').replace(/^[−–]/, '-');
  if (!compact) return undefined;
  const normal = normalize(compact, mark);
  return /^-?(\d+\.?\d*|\.\d+)$/.test(normal) ? Number(normal) : null;
}

export type Drafts = Partial<Record<Bound, string>>;
export type Checked = Partial<Record<Bound, { value: number | undefined; error?: string }>>;

function read(spec: LimitSpec, text: string | undefined, stored: number | undefined): { value: number | undefined; error?: string } {
  if (text === undefined) return { value: stored };
  const value = parseNumber(text);
  if (value === null) return { value: undefined, error: spec.whole ? 'Enter a whole number' : 'Enter a number' };
  if (spec.whole && value !== undefined && (!Number.isInteger(value) || value < 0))
    return { value: undefined, error: 'Enter a whole number' };
  return { value };
}

export function checkLimits(spec: LimitSpec, drafts: Drafts, rules: FieldValidation): Checked {
  const low = read(spec, drafts[spec.low.rule], rules[spec.low.rule]);
  const high = read(spec, drafts[spec.high.rule], rules[spec.high.rule]);
  if (low.value !== undefined && high.value !== undefined && low.value > high.value) {
    if (drafts[spec.low.rule] !== undefined) low.error = `Can't be more than ${String(high.value)}`;
    if (drafts[spec.high.rule] !== undefined) high.error = `Can't be less than ${String(low.value)}`;
    if (!low.error && !high.error) low.error = `Can't be more than ${String(high.value)}`;
  }
  return { [spec.low.rule]: low, [spec.high.rule]: high };
}

export function limitWrites(spec: LimitSpec, drafts: Drafts, rules: FieldValidation): [RuleName, number | undefined][] {
  const checked = checkLimits(spec, drafts, rules);
  return [spec.low.rule, spec.high.rule].flatMap((rule): [RuleName, number | undefined][] => {
    const result = checked[rule];
    if (drafts[rule] === undefined || !result || result.error || result.value === rules[rule]) return [];
    return [[rule, result.value]];
  });
}

export function patternError(pattern: string): string | undefined {
  try {
    new RegExp(pattern);
    return undefined;
  } catch {
    return 'Not a valid pattern';
  }
}

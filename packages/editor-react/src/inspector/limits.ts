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

const counts = (noun: string): LimitSpec => ({
  whole: true,
  pattern: false,
  low: side('minLength', `Min ${noun}`, 'Error if too few', (value) => `At least ${String(value)} required`),
  high: side('maxLength', `Max ${noun}`, 'Error if too many', (value) => `At most ${String(value)} allowed`),
});

const SPECS: Record<string, LimitSpec> = {
  number: {
    whole: false,
    pattern: false,
    low: side('min', 'Minimum', 'Error if too low', (value) => `Must be at least ${String(value)}`),
    high: side('max', 'Maximum', 'Error if too high', (value) => `Must be at most ${String(value)}`),
  },
  text: characters,
  textarea: characters,
  multiselect: counts('selections'),
  files: counts('files'),
};

export const limitSpec = (type: string): LimitSpec | undefined => SPECS[type];

function decimalMark(): string {
  return new Intl.NumberFormat().formatToParts(1.1).find((part) => part.type === 'decimal')?.value ?? '.';
}

export interface Parsed {
  value?: number;
  error?: string;
}

export function parseNumber(text: string, mark = decimalMark()): Parsed {
  const compact = text.trim().replace(/^[−–]/, '-');
  if (!compact) return {};
  const match = /^(-?)(\d*)(?:([.,])(\d+))?$/.exec(compact);
  if (!match || (!match[2] && !match[4])) {
    return {
      error: /\d[\s'’.,]\d.*[\s'’.,]/.test(compact) || /\d[\s'’]\d/.test(compact) ? 'Type the number without separators' : 'Enter a number',
    };
  }
  const [, sign, whole = '', separator, fraction] = match;
  if (separator && separator !== '.' && separator !== mark) return { error: `Use ${mark} as the decimal mark` };
  if (separator && fraction?.length === 3 && /[1-9]/.test(whole)) {
    return { error: `Type ${whole}${fraction} or ${whole}${mark}${fraction}0` };
  }
  return { value: Number(`${sign}${whole || '0'}${fraction ? `.${fraction}` : ''}`) };
}

export type Drafts = Partial<Record<Bound, string>>;
export type Checked = Partial<Record<Bound, { value: number | undefined; error?: string }>>;

function read(spec: LimitSpec, text: string | undefined, stored: number | undefined): { value: number | undefined; error?: string } {
  if (text === undefined) return { value: stored };
  const { value, error } = parseNumber(text);
  if (error) return { value: undefined, error: spec.whole && error === 'Enter a number' ? 'Enter a whole number' : error };
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
  return [spec.low, spec.high].flatMap(({ rule, message }): [RuleName, number | undefined][] => {
    const result = checked[rule];
    if (drafts[rule] === undefined || !result || result.error || result.value === rules[rule]) return [];
    return result.value === undefined && rules[message] !== undefined
      ? [
          [rule, undefined],
          [message, undefined],
        ]
      : [[rule, result.value]];
  });
}

export function storedLimits(spec: LimitSpec, rules: FieldValidation): string {
  return `${String(rules[spec.low.rule])}|${String(rules[spec.high.rule])}`;
}

export function patternError(pattern: string): string | undefined {
  try {
    new RegExp(pattern);
    return undefined;
  } catch {
    return 'Not a valid pattern';
  }
}

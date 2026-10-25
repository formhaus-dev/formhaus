import { atomChars, type CharSet, overlaps, union } from './pattern-chars';

const PATTERN_TOKEN =
  /(\(\?<?[=!])|(\((?:\?<[^>]*>|\?:)?)|(\)|\\(?:x[\da-f]{2}|u[\da-f]{4}|c[a-z]|\d+|k<(?:[$\w\x80-￿]|\\u[\da-f]{4}|\\u\{[\da-f]+\})+>|[^bB])|\[(?:\\.|[^\]])*]|[^|^$\\])((?:[*+?]|\{\d+(?:,\d*)?\})\??)?|\\?./gis;

const UNBOUNDED = /^(?:[*+]|\{\d+,\})/;
const MAX_BOUNDED_REPEAT = 10;

type Part = { chars: CharSet; quantifier: string; atom: boolean };

type PatternGroup = {
  look?: string;
  inner?: boolean;
  unbounded?: boolean;
  alternated?: boolean;
  entry?: CharSet;
  previous?: CharSet;
  chars: (readonly [number, number])[];
  parts: Part[];
};

type Chars = () => CharSet;

function exact(quantifier: string): boolean {
  const bounds = /^\{(\d+)(?:,(\d+))?\}/.exec(quantifier);
  return !quantifier || (!!bounds && (bounds[2] === undefined || bounds[1] === bounds[2]));
}

const mandatory = (quantifier: string) => exact(quantifier) || /^(?:\+|\{[1-9]\d*,)/.test(quantifier);

function separator(group: PatternGroup, index: number): Part | undefined {
  const part = group.parts[index];
  const others = group.parts.filter((_, at) => at !== index);
  if (!part?.atom || !mandatory(part.quantifier) || overlaps(part.chars, union(...others.map(({ chars }) => chars)))) return undefined;
  return exact(part.quantifier) || others.some(({ quantifier }) => mandatory(quantifier)) ? part : undefined;
}

function separators(group: PatternGroup): { lead?: CharSet; tail?: CharSet } {
  if (group.alternated) return {};
  const lead = separator(group, 0);
  const tail = separator(group, group.parts.length - 1);
  if (lead && (exact(lead.quantifier) || !tail || !exact(tail.quantifier))) return { lead: lead.chars };
  return { tail: tail?.chars };
}

function repeats(closed: PatternGroup, quantifier: string): boolean {
  if (!closed.inner || !/^[*+{]/.test(quantifier) || exact(quantifier)) return false;
  if (UNBOUNDED.test(quantifier) || closed.unbounded) return true;
  return Number(/,(\d+)/.exec(quantifier)?.[1]) > MAX_BOUNDED_REPEAT;
}

function trailing(group: PatternGroup, quantifier: string, first: Chars, last = first): CharSet | undefined | 'adjacent' {
  if (/^(?:\?|\{0(?:,\d+)?\})/.test(quantifier)) return group.previous;
  if (!UNBOUNDED.test(quantifier)) return undefined;
  if (group.previous && overlaps(group.previous, first())) return 'adjacent';
  const repeated = last();
  return /^(?:\*|\{0,\})/.test(quantifier) ? union(group.previous ?? [], repeated) : repeated;
}

export function slowPattern(pattern: string): 'nested' | 'adjacent' | 'long' | undefined {
  if (pattern.length > 1000) return 'long';
  const groups: PatternGroup[] = [{ chars: [], parts: [] }];
  for (const match of pattern.matchAll(PATTERN_TOKEN)) {
    const [token, look, open, atom, quantifier = ''] = match;
    let group = groups[groups.length - 1];
    if (look || open) {
      const entry = look ? undefined : group.previous;
      groups.push({ look, entry, previous: entry, chars: [], parts: [] });
      continue;
    }
    if (token === '|') group.inner = group.alternated = true;
    if (!atom) {
      group.previous = token === '|' ? group.entry : undefined;
      continue;
    }
    const closed = atom === ')' ? groups.pop() : undefined;
    let chars = closed ? closed.chars : atomChars(atom);
    let first: Chars = () => chars;
    let last = first;
    if (closed) {
      if (!groups.length) return undefined;
      group = groups[groups.length - 1];
      const { lead, tail } = separators(closed);
      if (!lead && !tail && repeats(closed, quantifier)) return 'nested';
      chars = closed.chars;
      first = lead ? () => lead : first;
      last = tail ? () => tail : last;
      group.inner ||= closed.inner;
      group.unbounded ||= closed.unbounded;
    }
    group.chars.push(...chars);
    group.parts.push({ chars, quantifier, atom: !closed });
    if (closed) {
      if (closed.look) {
        group.previous = undefined;
        continue;
      }
      if (!quantifier) {
        group.previous = closed.alternated ? undefined : closed.previous;
        continue;
      }
    }
    group.inner ||= !exact(quantifier);
    group.unbounded ||= UNBOUNDED.test(quantifier);
    const next = trailing(group, quantifier, first, last);
    if (next === 'adjacent') return next;
    group.previous = next;
  }
  return undefined;
}

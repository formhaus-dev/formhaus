const PATTERN_TOKEN =
  /(\(\?<?[=!])|(\((?:\?<[^>]*>|\?:)?)|(\)|\\(?:x[\da-f]{2}|u[\da-f]{4}|c[a-z]|\d+|k<(?:[$\w\x80-\uffff]|\\u[\da-f]{4}|\\u\{[\da-f]+\})+>|[^bB])|\[(?:\\.|[^\]])*]|[^|^$\\])((?:[*+?]|\{\d+(?:,\d*)?\})\??)?|\\?./gis;

const ASCII = /* @__PURE__ */ Array.from({ length: 128 }, (_, code) => String.fromCharCode(code));

function samples(atom: string): string[] {
  if (/^\\[1-9k]/.test(atom)) return ASCII;
  try {
    const regex = new RegExp(`^(?:${atom})$`);
    return ASCII.filter((char) => regex.test(char));
  } catch {
    return [];
  }
}

type PatternGroup = {
  start: number;
  look?: string;
  inner?: boolean;
  alternated?: boolean;
  entry?: string[];
  previous?: string[];
  chars: string;
  lead?: string;
  tail?: string;
};

type Chars = () => string[];

export type SlowPattern = 'nested' | 'adjacent' | 'long';

export interface PatternScan {
  slow?: SlowPattern;
  overlaps: number;
  optionalOverlaps: number;
  fixedOverlaps: number;
}

const OPTIONAL = /^(?:\?|\{0(?:,\d+)?\})/;
const UNBOUNDED = /^(?:[*+]|\{\d+,\})/;

function following(group: PatternGroup, quantifier: string, last: Chars): string[] | undefined {
  if (OPTIONAL.test(quantifier)) return group.previous;
  if (!UNBOUNDED.test(quantifier)) return undefined;
  const repeated = last();
  return /^(?:\*|\{0,\})/.test(quantifier) ? [...new Set([...(group.previous ?? []), ...repeated])] : repeated;
}

export function scanPattern(pattern: string): PatternScan {
  const scan: PatternScan = { overlaps: 0, optionalOverlaps: 0, fixedOverlaps: 0 };
  if (pattern.length > 1000) return { ...scan, slow: 'long' };
  const done = (): PatternScan => (scan.overlaps ? { ...scan, slow: 'adjacent' } : scan);
  const groups: PatternGroup[] = [{ start: 0, chars: '' }];
  for (const match of pattern.matchAll(PATTERN_TOKEN)) {
    const [token, look, open, atom, quantifier = ''] = match;
    let group = groups[groups.length - 1];
    if (look || open) {
      const entry = look ? undefined : group.previous;
      groups.push({ start: match.index, look, entry, previous: entry, chars: '' });
      continue;
    }
    if (token === '|') group.inner = group.alternated = true;
    if (!atom) {
      group.previous = token === '|' ? group.entry : undefined;
      continue;
    }
    const own = samples(atom);
    let chars = own.join('');
    let first: Chars = () => own;
    let last = first;
    const separator = !quantifier && chars.length === 1 && /^\\?\W$/.test(atom) ? chars : '';
    const closed = atom === ')' ? groups.pop() : undefined;
    if (closed) {
      if (!groups.length) return done();
      group = groups[groups.length - 1];
      const separated = closed.alternated ? '' : [closed.lead, closed.tail].find((char) => char && closed.chars.split(char).length === 2);
      if (closed.inner && !separated && /^[*+{]/.test(quantifier)) return { ...scan, slow: 'nested' };
      const all = () => [...closed.chars];
      first = separated && separated === closed.lead ? () => [separated] : all;
      last = separated && separated === closed.tail ? () => [separated] : all;
      group.inner ||= closed.inner;
      chars = closed.chars;
    }
    group.chars += chars;
    group.lead ??= separator;
    group.tail = separator;
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
    group.inner ||= !!quantifier;
    const leading = first();
    if (group.previous?.some((char) => leading.includes(char))) {
      if (UNBOUNDED.test(quantifier)) scan.overlaps++;
      else if (/^\?\??$/.test(quantifier)) scan.optionalOverlaps++;
      else scan.fixedOverlaps++;
    }
    group.previous = following(group, quantifier, last);
  }
  return done();
}

export const slowPattern = (pattern: string): SlowPattern | undefined => scanPattern(pattern).slow;

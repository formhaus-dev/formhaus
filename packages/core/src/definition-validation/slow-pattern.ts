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
  entry?: Runs;
  previous?: Runs;
  chars: string;
  lead?: string;
  tail?: string;
};

const OVERLAPPING = ['repeats overlapping parts next to each other', 'Merge the repeated parts into one'];

export const SLOW_PATTERNS = {
  nested: ['nests quantifiers', 'Remove the inner or outer quantifier'],
  adjacent: OVERLAPPING,
  quadratic: OVERLAPPING,
  long: ['is longer than 1000 characters', 'Shorten it to 1000 characters or less'],
};

type Chars = () => string[];
type Runs = Map<string, number>;

function trailing({ previous }: PatternGroup, quantifier: string, first: Chars, last = first): Runs | undefined {
  if (/^(?:\?|\{0(?:,\d+)?\})/.test(quantifier)) return previous;
  if (!/^(?:[*+]|\{\d+,\})/.test(quantifier)) return undefined;
  const runs = new Map(/^(?:\*|\{0,\})/.test(quantifier) ? previous : undefined);
  const depth = Math.max(...first().map((char) => previous?.get(char) ?? 0)) + 1;
  for (const char of last()) runs.set(char, Math.max(runs.get(char) ?? 0, depth));
  return runs;
}

export function slowPattern(pattern: string): 'nested' | 'adjacent' | 'quadratic' | 'long' | undefined {
  if (pattern.length > 1000) return 'long';
  let depth = 1;
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
      if (!groups.length) return undefined;
      group = groups[groups.length - 1];
      const separated = closed.alternated ? '' : [closed.lead, closed.tail].find((char) => char && closed.chars.split(char).length === 2);
      if (closed.inner && !separated && /^[*+{]/.test(quantifier)) return 'nested';
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
    const next = trailing(group, quantifier, first, last);
    depth = Math.max(depth, ...(next?.values() ?? []));
    group.previous = next;
  }
  if (depth > 1) return depth < 3 && pattern[0] === '^' && !groups[0].alternated ? 'quadratic' : 'adjacent';
  return undefined;
}

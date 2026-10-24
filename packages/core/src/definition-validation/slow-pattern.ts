const PATTERN_TOKEN =
  /(\(\?<?[=!])|(\((?:\?<[^>]*>|\?:)?)|(\)|\\(?:x[\da-f]{2}|u[\da-f]{4}|c[a-z]|\d+|[^bB])|\[(?:\\.|[^\]])*]|[^|^$\\])((?:[*+?]|\{\d+(?:,\d*)?\})\??)?|\\?./gis;

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

function trailing(group: PatternGroup, quantifier: string, first: Chars, last = first): string[] | undefined | 'adjacent' {
  if (/^(?:\?|\{0(?:,\d+)?\})/.test(quantifier)) return group.previous;
  if (!/^(?:[*+]|\{\d+,\})/.test(quantifier)) return undefined;
  const leading = first();
  if (group.previous?.some((char) => leading.includes(char))) return 'adjacent';
  const repeated = last();
  return /^(?:\*|\{0,\})/.test(quantifier) ? [...new Set([...(group.previous ?? []), ...repeated])] : repeated;
}

export function slowPattern(pattern: string): 'nested' | 'adjacent' | 'long' | undefined {
  if (pattern.length > 1000) return 'long';
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
    if (next === 'adjacent') return next;
    group.previous = next;
  }
  return undefined;
}

const PUNCTUATION = '!"#$%&\'()*+,-./:;<=>?@[\\]^_`{|}~';
const SPECIAL = '.^$|()[]{}*+?\\';

const ASCII = Array.from({ length: 128 }, (_, code) => String.fromCharCode(code));

type Item = { chars: string[]; quantifier: string };

const isPrintable = (char: string) => char >= ' ' && char <= '~';

function charsOf(atom: string): string[] {
  const regex = new RegExp(`^${atom}$`);
  return ASCII.filter((char) => regex.test(char));
}

function classMember(source: string, at: number): number {
  const char = source[at];
  if (char === '\\') {
    const next = source[at + 1];
    return next !== undefined && (PUNCTUATION.includes(next) || 'dws'.includes(next)) ? at + 2 : -1;
  }
  return char !== undefined && char !== ']' && isPrintable(char) ? at + 1 : -1;
}

function classEnd(source: string, start: number): number {
  let at = start + 1;
  if (source[at] === '^' || source[at] === ']') return -1;
  while (source[at] !== ']') {
    const end = classMember(source, at);
    if (end < 0) return -1;
    const ranged = source[end] === '-' && source[end + 1] !== ']' && source[end + 1] !== undefined;
    if (!ranged) {
      at = end;
      continue;
    }
    const last = classMember(source, end + 1);
    const single = (from: number, to: number) => to - from === 1 || !'dws'.includes(source[from + 1]);
    if (last < 0 || !single(at, end) || !single(end + 1, last)) return -1;
    if (source[end - 1] > source[last - 1]) return -1;
    at = last;
  }
  return at + 1;
}

function atomEnd(source: string, at: number): number {
  const char = source[at];
  if (char === '[') return classEnd(source, at);
  if (char === '\\') {
    const next = source[at + 1];
    return next !== undefined && (PUNCTUATION.includes(next) || 'dws'.includes(next)) ? at + 2 : -1;
  }
  return char !== undefined && isPrintable(char) && !SPECIAL.includes(char) ? at + 1 : -1;
}

function items(pattern: string): Item[] | undefined {
  if (pattern[0] !== '^') return undefined;
  const end = pattern.endsWith('$') && !pattern.endsWith('\\$') ? pattern.length - 1 : pattern.length;
  const result: Item[] = [];
  let grouped = false;
  let at = 1;
  while (at < end) {
    const open = pattern.startsWith('(?:', at) ? 3 : pattern[at] === '(' && pattern[at + 1] !== '?' ? 1 : 0;
    if (open) {
      if (grouped) return undefined;
      grouped = true;
      at += open;
      continue;
    }
    if (pattern[at] === ')') {
      if (!grouped || '?*+{'.includes(pattern[at + 1] ?? '')) return undefined;
      grouped = false;
      at += 1;
      continue;
    }
    const atomStop = atomEnd(pattern, at);
    if (atomStop < 0 || atomStop > end) return undefined;
    const quantifier = '+*?'.includes(pattern[atomStop] ?? '') && atomStop < end ? pattern[atomStop] : '';
    const next = atomStop + quantifier.length;
    if (quantifier && next < end && '+*?{'.includes(pattern[next])) return undefined;
    if (!quantifier && pattern[atomStop] === '{') return undefined;
    result.push({ chars: charsOf(pattern.slice(at, atomStop)), quantifier });
    at = next;
  }
  return grouped ? undefined : result;
}

export function isQuadratic(pattern: string): boolean {
  const sequence = items(pattern);
  if (!sequence) return false;
  let previous = new Set<string>();
  let overlaps = 0;
  let optionalOverlaps = 0;
  for (const { chars, quantifier } of sequence) {
    const overlapping = chars.some((char) => previous.has(char));
    if (quantifier === '+' || quantifier === '*') {
      if (overlapping) overlaps++;
      previous = new Set(quantifier === '*' ? [...previous, ...chars] : chars);
    } else if (quantifier === '?') {
      if (overlapping) optionalOverlaps++;
      previous = new Set([...previous, ...chars]);
    } else {
      if (overlapping) return false;
      previous = new Set();
    }
  }
  return overlaps === 1 && optionalOverlaps <= 1;
}

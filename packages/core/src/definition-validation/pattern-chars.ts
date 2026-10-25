export type CharSet = readonly (readonly [number, number])[];

const MAX = 0xffff;
const ALL: CharSet = [[0, MAX]];
const DIGITS: CharSet = [[48, 57]];
const WORD: CharSet = [
  [48, 57],
  [65, 90],
  [95, 95],
  [97, 122],
];
const SPACE: CharSet = [
  [9, 13],
  [32, 32],
  [160, 160],
  [5760, 5760],
  [8192, 8202],
  [8232, 8233],
  [8239, 8239],
  [8287, 8287],
  [12288, 12288],
  [65279, 65279],
];
const LINE_BREAKS: CharSet = [
  [10, 10],
  [13, 13],
  [8232, 8233],
];
const CONTROL: Record<string, number> = { n: 10, t: 9, r: 13, f: 12, v: 11 };
const CLASSES: Record<string, CharSet> = { d: DIGITS, w: WORD, s: SPACE };

function complement(set: CharSet): CharSet {
  const sorted = [...set].sort((a, b) => a[0] - b[0]);
  const result: [number, number][] = [];
  let next = 0;
  for (const [low, high] of sorted) {
    if (low > next) result.push([next, low - 1]);
    next = Math.max(next, high + 1);
  }
  if (next <= MAX) result.push([next, MAX]);
  return result;
}

export const union = (...sets: CharSet[]): CharSet => sets.flat();

export const overlaps = (left: CharSet, right: CharSet): boolean =>
  left.some(([low, high]) => right.some(([from, to]) => low <= to && from <= high));

const single = (code: number): CharSet => [[code, code]];

function classEscape(letter: string): CharSet | undefined {
  const set = CLASSES[letter.toLowerCase()];
  return set && (letter === letter.toLowerCase() ? set : complement(set));
}

type Read = { set?: CharSet; code?: number; end: number };

function hex(source: string, at: number, length: number): number | undefined {
  const digits = source.slice(at, at + length);
  return digits.length === length && /^[\da-f]+$/i.test(digits) ? Number.parseInt(digits, 16) : undefined;
}

function escaped(source: string, at: number, inClass: boolean): Read {
  const char = source[at] ?? '\\';
  const set = classEscape(char);
  if (set) return { set, end: at + 1 };
  if (char in CONTROL) return { code: CONTROL[char], end: at + 1 };
  if (inClass && char === 'b') return { code: 8, end: at + 1 };
  if (char === 'x' || char === 'u') {
    const length = char === 'x' ? 2 : 4;
    const code = hex(source, at + 1, length);
    if (code !== undefined) return { code, end: at + 1 + length };
  }
  if (char === 'c' && /[a-z]/i.test(source[at + 1] ?? '')) return { code: source.charCodeAt(at + 1) % 32, end: at + 2 };
  if (char === 'c') return { code: 92, end: at };
  if (/\d/.test(char)) {
    if (char !== '0' && !inClass) return { set: ALL, end: source.length };
    const octal = /^(?:[0-3][0-7]{0,2}|[4-7][0-7]?)/.exec(source.slice(at))?.[0];
    if (octal) return { code: Number.parseInt(octal, 8), end: at + octal.length };
  }
  if (char === 'k' && !inClass) return { set: ALL, end: source.length };
  return { code: char.charCodeAt(0), end: at + 1 };
}

function member(source: string, at: number): Read {
  return source[at] === '\\' ? escaped(source, at + 1, true) : { code: source.charCodeAt(at), end: at + 1 };
}

function characterClass(atom: string): CharSet {
  const negated = atom[1] === '^';
  const end = atom.length - 1;
  const ranges: [number, number][] = [];
  let at = negated ? 2 : 1;
  while (at < end) {
    const from = member(atom, at);
    at = from.end;
    if (from.set) {
      ranges.push(...from.set);
      continue;
    }
    const to = atom[at] === '-' && at + 1 < end ? member(atom, at + 1) : undefined;
    if (to && to.code !== undefined) {
      ranges.push([from.code!, to.code]);
      at = to.end;
    } else ranges.push([from.code!, from.code!]);
  }
  return negated ? complement(ranges) : ranges;
}

export function atomChars(atom: string): CharSet {
  if (atom[0] === '[') return characterClass(atom);
  if (atom === '.') return complement(LINE_BREAKS);
  if (atom[0] !== '\\') return single(atom.charCodeAt(0));
  const read = escaped(atom, 1, false);
  return read.set ?? single(read.code!);
}

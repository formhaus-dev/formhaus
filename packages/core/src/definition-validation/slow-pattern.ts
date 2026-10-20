const PATTERN_TOKEN =
  /(\(\?<?[=!])|(\((?:\?<[^>]*>|\?:)?)|(\)|\\(?:x[\da-f]{2}|u[\da-f]{4}|c[a-z]|\d+|[^bB])|\[(?:\\.|[^\]])*]|[^|^$\\])((?:[*+?]|\{\d+(?:,\d*)?\})\??)?|\\?./gis;

const ASCII = /* @__PURE__ */ Array.from({ length: 128 }, (_, code) => String.fromCharCode(code));

function samples(atom: string): string[] {
  try {
    const regex = new RegExp(`^(?:${atom})$`);
    return ASCII.filter((char) => regex.test(char));
  } catch {
    return [];
  }
}

type PatternGroup = { start: number; look?: string; inner?: boolean; previous?: string[] };

export function slowPattern(pattern: string): 'nested' | 'adjacent' | undefined {
  const groups: PatternGroup[] = [{ start: 0 }];
  for (const match of pattern.length > 1000 ? [] : pattern.matchAll(PATTERN_TOKEN)) {
    const [token, look, open, atom, quantifier = ''] = match;
    let group = groups[groups.length - 1];
    if (look || open) {
      groups.push({ start: match.index, look });
      continue;
    }
    if (token === '|') group.inner = true;
    if (!atom) {
      group.previous = undefined;
      continue;
    }
    let source = atom;
    if (atom === ')') {
      if (groups.length < 2) return undefined;
      const closed = groups.pop()!;
      group = groups[groups.length - 1];
      if (closed.inner && /^[*+{]/.test(quantifier)) return 'nested';
      group.inner ||= closed.inner;
      if (closed.look) {
        group.previous = undefined;
        continue;
      }
      source = pattern.slice(closed.start, match.index + 1);
    }
    group.inner ||= !!quantifier;
    const repeated = /^(?:[*+]|\{\d+,\})/.test(quantifier) ? samples(source) : undefined;
    if (repeated && group.previous?.some((char) => repeated.includes(char))) return 'adjacent';
    group.previous = repeated;
  }
  return undefined;
}

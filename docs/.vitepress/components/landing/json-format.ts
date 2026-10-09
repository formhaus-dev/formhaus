const WIDTH = 72;

function inline(value: unknown): string {
  if (Array.isArray(value)) return value.length ? `[${value.map(inline).join(', ')}]` : '[]';
  if (value && typeof value === 'object') {
    const entries = Object.entries(value).map(([key, item]) => `${JSON.stringify(key)}: ${inline(item)}`);
    return entries.length ? `{ ${entries.join(', ')} }` : '{}';
  }
  return JSON.stringify(value);
}

function format(value: unknown, depth: number, prefix: string): string {
  const pad = '  '.repeat(depth);
  const flat = inline(value);
  if (!value || typeof value !== 'object' || pad.length + prefix.length + flat.length <= WIDTH) return flat;
  const inner = '  '.repeat(depth + 1);
  if (Array.isArray(value)) {
    return `[\n${value.map((item) => inner + format(item, depth + 1, '')).join(',\n')}\n${pad}]`;
  }
  const lines = Object.entries(value).map(([key, item]) => {
    const head = `${JSON.stringify(key)}: `;
    return inner + head + format(item, depth + 1, head);
  });
  return `{\n${lines.join(',\n')}\n${pad}}`;
}

export function formatJson(value: unknown): string {
  return `${format(value, 0, '')}\n`;
}

export type TokenKind = 'key' | 'string' | 'literal' | 'punct';
export interface Token { kind: TokenKind; text: string }

const TOKEN = /("(?:[^"\\]|\\.)*")(\s*:)?|(-?\d+(?:\.\d+)?|true|false|null)|([^"\d\-tfn]+|.)/g;

export function tokenize(source: string): Token[][] {
  return source.replace(/\n$/, '').split('\n').map((line) => {
    const tokens: Token[] = [];
    for (const match of line.matchAll(TOKEN)) {
      if (match[1] && match[2]) tokens.push({ kind: 'key', text: match[1] }, { kind: 'punct', text: match[2] });
      else if (match[1]) tokens.push({ kind: 'string', text: match[1] });
      else if (match[3]) tokens.push({ kind: 'literal', text: match[3] });
      else tokens.push({ kind: 'punct', text: match[0] });
    }
    return tokens;
  });
}

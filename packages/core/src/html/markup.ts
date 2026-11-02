export class Html {
  constructor(readonly value: string) {}

  toString(): string {
    return this.value;
  }
}

export type Child = Html | string | number | false | null | undefined | readonly Child[];

export type Attrs = Record<string, string | number | boolean | null | undefined>;

const VOID = ['input', 'img'];
const ESCAPES: Record<string, string> = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;', '\0': '\uFFFD' };
const UNSAFE = /[&<>"'\0]/;
const UNSAFE_ALL = /[&<>"'\0]/g;

const escapeHtml = (text: string): string => (UNSAFE.test(text) ? text.replace(UNSAFE_ALL, (char) => ESCAPES[char]) : text);

function collect(children: readonly Child[], parts: string[]): void {
  for (const child of children) {
    if (child instanceof Html) parts.push(child.value);
    else if (Array.isArray(child)) collect(child, parts);
    else if (typeof child === 'string' || typeof child === 'number') parts.push(escapeHtml(String(child)));
  }
}

function content(children: readonly Child[]): string {
  const parts: string[] = [];
  collect(children, parts);
  return parts.join('');
}

export function html(name: string, attrs: Attrs, ...children: Child[]): Html {
  let open = `<${name}`;
  for (const key of Object.keys(attrs)) {
    const value = attrs[key];
    if (value === undefined || value === null || value === false) continue;
    open += value === true ? (key.startsWith('aria-') ? ` ${key}="true"` : ` ${key}`) : ` ${key}="${escapeHtml(String(value))}"`;
  }
  open += '>';
  return new Html(VOID.includes(name) ? open : `${open}${content(children)}</${name}>`);
}

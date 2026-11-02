const TAG = /<[^>]*>/g;
const WELL_FORMED = /^<\/?[a-z][a-z0-9]*(?:\s[a-z][a-z0-9:_-]*(?:="[^"<>]*")?)*>$/;
const SAFE_SOURCE = /^(?:#[\w-]*|https?:\/\/[^\s@\\]+|\/[^\s/\\][^\s\\]*)$/;
const ELEMENTS = [
  'form',
  'div',
  'span',
  'p',
  'label',
  'input',
  'textarea',
  'select',
  'option',
  'datalist',
  'fieldset',
  'legend',
  'button',
  'strong',
  'ul',
  'ol',
  'li',
  'a',
  'img',
  'h1',
  'h2',
  'h3',
  'h4',
  'h5',
  'h6',
];
const ATTRIBUTES = [
  'id',
  'class',
  'name',
  'type',
  'value',
  'for',
  'checked',
  'selected',
  'disabled',
  'autofocus',
  'formnovalidate',
  'hidden',
  'required',
  'readonly',
  'multiple',
  'method',
  'action',
  'enctype',
  'novalidate',
  'formnovalidate',
  'lang',
  'role',
  'tabindex',
  'rows',
  'min',
  'max',
  'step',
  'minlength',
  'maxlength',
  'pattern',
  'placeholder',
  'inputmode',
  'autocomplete',
  'accept',
  'list',
  'href',
  'src',
  'alt',
  'loading',
  'decoding',
  'referrerpolicy',
  'style',
  'data-fh',
  'data-columns',
];

export function unsafeMarkup(markup: string): string[] {
  const found: string[] = [];
  const stripped = markup.replace(TAG, '');
  if (/[<>]/.test(stripped.replace(/&[lg]t;/g, ''))) found.push('raw angle bracket in text');
  for (const tag of markup.match(TAG) ?? []) {
    if (!WELL_FORMED.test(tag)) {
      found.push(`malformed tag ${tag}`);
      continue;
    }
    const name = /^<\/?([a-z][a-z0-9]*)/.exec(tag)![1];
    if (!ELEMENTS.includes(name)) found.push(`element ${name}`);
    for (const [, attribute, value] of tag.matchAll(/\s([a-z][a-z0-9:_-]*)(?:="([^"]*)")?/g)) {
      if (!ATTRIBUTES.includes(attribute) && !attribute.startsWith('aria-')) found.push(`attribute ${attribute}`);
      if ((attribute === 'href' || attribute === 'src') && !SAFE_SOURCE.test(value ?? '')) found.push(`${attribute}="${value}"`);
      if (attribute === 'action' && !/^(?:https?:\/\/[^\s@\\]+|\/[^\s/\\][^\s\\]*|[\w./-]+)$/.test(value ?? ''))
        found.push(`action="${value}"`);
      if (attribute === 'style' && !/^(?:width:[\d.]+%|--fhi-[a-z-]+:\d+)$/.test(value ?? '')) found.push(`style="${value}"`);
    }
  }
  return found;
}

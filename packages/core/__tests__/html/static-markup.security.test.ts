import { describe, expect, it } from 'vitest';
import type { FormDefinition } from '../../src';
import { renderToStaticMarkup } from '../../src/html';
import { unsafeMarkup } from './markup-safety';

const SCRIPT = '<script>alert(1)</script>';
const BREAKOUT = '"><img src=x onerror=alert(1)>';
const SINGLE = "' onfocus='alert(1)";
const PAYLOADS = [SCRIPT, BREAKOUT, SINGLE, '</textarea><script>1</script>', '</select><svg onload=alert(1)>', '&lt;b&gt;&amp;', '\0<b>'];

function hostile(payload: string): FormDefinition {
  const option = { value: payload, label: payload, description: payload, image: `javascript:alert('${payload}')` };
  return {
    id: payload,
    title: payload,
    description: payload,
    lang: payload,
    submit: { label: payload, variant: payload as 'primary' },
    cancel: { label: payload, variant: payload as 'primary' },
    fields: [
      {
        key: 'text',
        type: 'text',
        label: payload,
        helperText: payload,
        placeholder: payload,
        defaultValue: payload,
        autocomplete: payload,
        inputMode: payload as 'text',
        validation: { required: true, pattern: payload },
      },
      { key: 'area', type: 'textarea', label: payload, defaultValue: payload, rows: payload as unknown as number },
      { key: 'num', type: 'number', label: payload },
      { key: 'pick', type: 'select', label: payload, placeholder: payload, defaultValue: payload, options: [option] },
      { key: 'one', type: 'radio', label: payload, options: [option] },
      { key: 'many', type: 'multiselect', label: payload, defaultValue: [payload], options: [option] },
      { key: 'auto', type: 'autocomplete', label: payload, defaultValue: payload, options: [option] },
      { key: 'scale', type: 'scale', label: payload, options: [{ value: '1', label: payload }] },
      { key: 'box', type: 'checkbox', label: payload },
      { key: 'secret', type: 'hidden', defaultValue: payload },
      { key: 'when', type: 'datetime', label: payload, defaultValue: payload },
      {
        key: 'part',
        type: 'section',
        title: payload,
        description: payload,
        fields: [{ key: 'inner', type: 'text', label: payload }],
      },
    ],
  } as unknown as FormDefinition;
}

function render(definition: FormDefinition, values: Record<string, unknown> = {}, payload = SCRIPT): string {
  return renderToStaticMarkup(definition, {
    values,
    errors: { text: payload, area: payload, pick: payload, one: payload },
    formErrors: [payload],
    action: `javascript:${payload}`,
    id: payload,
    className: payload,
    hiddenInputs: { [payload]: payload },
    labels: { required: payload, submit: payload, errorSummary: payload } as never,
  });
}

describe('static markup escaping', () => {
  it.each(PAYLOADS)('keeps every definition text inert: %j', (payload) => {
    expect(unsafeMarkup(render(hostile(payload), {}, payload))).toEqual([]);
  });

  it.each(PAYLOADS)('keeps every prefilled value inert: %j', (payload) => {
    const values = {
      text: payload,
      area: payload,
      pick: payload,
      one: payload,
      many: [payload, payload],
      auto: payload,
      box: payload,
      secret: payload,
    };
    expect(unsafeMarkup(render(hostile('safe'), values, payload))).toEqual([]);
  });

  it('escapes text and quotes in both contexts', () => {
    const markup = renderToStaticMarkup(
      {
        id: 'f',
        title: 'T',
        submit: { label: 'Go' },
        fields: [{ key: 'a', type: 'text', label: `<b>"Q" & 'S'</b>`, placeholder: BREAKOUT }],
      },
      { values: { a: SINGLE } },
    );
    expect(markup).toContain('&lt;b&gt;&quot;Q&quot; &amp; &#39;S&#39;&lt;/b&gt;');
    expect(markup).toContain('placeholder="&quot;&gt;&lt;img src=x onerror=alert(1)&gt;"');
    expect(markup).toContain('value="&#39; onfocus=&#39;alert(1)"');
  });

  it('replaces NUL characters', () => {
    const markup = renderToStaticMarkup({
      id: 'f',
      title: 'T',
      submit: { label: 'Go' },
      fields: [{ key: 'a', type: 'text', label: 'a\0b' }],
    });
    expect(markup).not.toContain('\0');
    expect(markup).toContain('a�b');
  });

  it('does not let a textarea value close the element or lose its first line break', () => {
    const markup = renderToStaticMarkup(
      { id: 'f', title: 'T', submit: { label: 'Go' }, fields: [{ key: 'a', type: 'textarea', label: 'A' }] },
      { values: { a: '\n</textarea><script>1</script>' } },
    );
    expect(markup).toContain('>\n\n&lt;/textarea&gt;&lt;script&gt;1&lt;/script&gt;</textarea>');
  });
});

describe('static markup links', () => {
  const definition = (image: string): FormDefinition => ({
    id: 'f',
    title: 'T',
    submit: { label: 'Go' },
    fields: [{ key: 'a', type: 'radio', label: 'A', options: [{ value: 'x', label: 'X', image }] }],
  });

  it.each([
    'javascript:alert(1)',
    ' JaVaScRiPt:alert(1)',
    'java\tscript:alert(1)',
    '\u0001javascript:alert(1)',
    'data:text/html,<script>1</script>',
    'data:image/svg+xml,<svg onload=alert(1)>',
    'vbscript:msgbox(1)',
    'file:///etc/passwd',
    'https://user:pass@example.com/a.png',
    '//user@example.com/a.png',
  ])('drops the option image %j', (image) => {
    expect(renderToStaticMarkup(definition(image))).not.toContain('<img');
  });

  it.each(['https://example.com/a.png', '/img/a.png', 'img/a.png', 'data:image/png;base64,AAAA'])('keeps the option image %j', (image) => {
    expect(renderToStaticMarkup(definition(image))).toContain('<img');
  });

  it.each(['javascript:alert(1)', 'data:text/html,x', ' vbscript:x', 'file:///x', 'https://u:p@evil.test/'])(
    'drops the form action %j',
    (action) => {
      expect(renderToStaticMarkup(definition('/a.png'), { action })).not.toContain('action=');
    },
  );

  it.each(['/submit', 'https://example.com/submit', 'submit?x=1'])('keeps the form action %j', (action) => {
    expect(renderToStaticMarkup(definition('/a.png'), { action })).toContain(`action="${action}"`);
  });

  it('writes summary links as fragments only', () => {
    const markup = renderToStaticMarkup(
      { id: 'f', title: 'T', submit: { label: 'Go' }, fields: [{ key: 'javascript:alert(1)', type: 'text', label: 'A' }] },
      { errors: { 'javascript:alert(1)': 'Bad' } },
    );
    expect(markup).toMatch(/href="#[\w-]+"/);
    expect(unsafeMarkup(markup)).toEqual([]);
  });
});

describe('static markup with hostile structure', () => {
  const definition = (type: string, key: string): FormDefinition =>
    ({ id: 'f', title: 'T', submit: { label: 'Go' }, fields: [{ key, type, label: 'L' }] }) as FormDefinition;

  it.each(['__proto__', 'constructor', 'toString', 'hasOwnProperty', 'valueOf', 'custom'])('treats the type %j as unsupported', (type) => {
    const markup = renderToStaticMarkup(definition(type, 'a'));
    expect(markup).toContain('fh-field--unsupported');
    expect(markup).not.toContain('<input');
  });

  it.each(['a"b', 'a b', 'a<b>', "a'b", 'a.b.c', 'javascript:1'])('names a field %j without breaking out', (key) => {
    const markup = renderToStaticMarkup(definition('text', key), { values: { [key]: SCRIPT } });
    expect(unsafeMarkup(markup)).toEqual([]);
  });

  it.each(['__proto__', 'constructor'])('rejects the field key %j', (key) => {
    expect(() => renderToStaticMarkup(definition('text', key))).toThrow(/built-in object property/);
  });

  it('does not pollute prototypes through values or errors', () => {
    const values = JSON.parse('{"__proto__":{"polluted":"yes"},"constructor":{"prototype":{"polluted":"yes"}},"a":"x"}');
    const errors = JSON.parse('{"__proto__":"bad","constructor":"bad"}');
    renderToStaticMarkup(definition('text', 'a'), { values, errors });
    expect(({} as Record<string, unknown>).polluted).toBeUndefined();
    expect((Object.prototype as unknown as Record<string, unknown>).polluted).toBeUndefined();
  });

  it('renders no raw markup for any text key of a definition', () => {
    const markup = render(hostile(SCRIPT));
    expect(markup).not.toContain('<script');
    expect(markup).not.toMatch(/<[^>]*\sonerror=/);
  });
});

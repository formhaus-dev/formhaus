import { describe, expect, it } from 'vitest';
import type { FormDefinition } from '../../src';
import { renderToStaticMarkup } from '../../src/html';
import { form } from './fixtures';

describe('form element', () => {
  it('posts to the current page by default', () => {
    expect(renderToStaticMarkup(form([]))).toMatch(/^<form class="fh-form" method="post">/);
  });

  it('takes action, method, id, class and lang', () => {
    const markup = renderToStaticMarkup(form([], { lang: 'de' }), { action: '/submit', method: 'get', id: 'x', className: 'wide' });
    expect(markup).toContain('<form id="x" class="fh-form wide" method="get" action="/submit" lang="de">');
  });

  it('writes extra hidden inputs for tokens', () => {
    expect(renderToStaticMarkup(form([]), { hiddenInputs: { csrf: 'abc' } })).toContain('<input type="hidden" name="csrf" value="abc">');
  });

  it('can turn off native validation', () => {
    expect(renderToStaticMarkup(form([]), { novalidate: true })).toContain(' novalidate');
    expect(renderToStaticMarkup(form([]))).not.toContain('novalidate');
  });

  it('throws on a definition the engine rejects', () => {
    expect(() => renderToStaticMarkup({ id: 'f', title: 'T' } as FormDefinition)).toThrow();
  });
});

describe('conditions', () => {
  const definition = form([
    {
      key: 'kind',
      type: 'radio',
      label: 'Kind',
      options: [
        { value: 'a', label: 'A' },
        { value: 'b', label: 'B' },
      ],
    },
    { key: 'extra', type: 'text', label: 'Extra', show: [{ field: 'kind', eq: 'b' }] },
  ]);

  it('leaves out fields whose condition is not met', () => {
    expect(renderToStaticMarkup(definition, { values: { kind: 'a' } })).not.toContain('name="extra"');
  });

  it('renders fields whose condition is met by the given values', () => {
    expect(renderToStaticMarkup(definition, { values: { kind: 'b' } })).toContain('name="extra"');
  });

  it('disables the primary action by its condition', () => {
    const disabled = form([{ key: 'a', type: 'text', label: 'A' }], { submit: { label: 'Go', disabled: [{ field: 'a', eq: 'no' }] } });
    expect(renderToStaticMarkup(disabled, { values: { a: 'no' } })).toMatch(/<button[^>]*disabled/);
    expect(renderToStaticMarkup(disabled, { values: { a: 'yes' } })).not.toMatch(/<button[^>]*disabled/);
  });

  it('applies read-only conditions to controls', () => {
    const locked = form([
      { key: 'a', type: 'text', label: 'A', readOnly: [{ field: 'b', eq: 'x' }] },
      { key: 'b', type: 'text', label: 'B' },
    ]);
    expect(renderToStaticMarkup(locked, { values: { b: 'x' } })).toMatch(/name="a"[^>]* readonly/);
    expect(renderToStaticMarkup(locked, { values: { b: 'y' } })).not.toContain('readonly');
  });

  it('locks choices and switches of a read-only form', () => {
    const markup = renderToStaticMarkup(
      form([
        {
          key: 'r',
          type: 'radio',
          label: 'R',
          options: [
            { value: 'x', label: 'X' },
            { value: 'y', label: 'Y' },
          ],
        },
        { key: 'on', type: 'switch', label: 'On' },
      ]),
      { readOnly: true, values: { r: 'x', on: true } },
    );
    expect(markup).toMatch(/value="y" disabled/);
    expect(markup).toMatch(/role="switch"[^>]* disabled/);
    expect(markup).toContain('<input type="hidden" id="fh-on-value" name="on" value="on" data-fh="static">');
  });
});

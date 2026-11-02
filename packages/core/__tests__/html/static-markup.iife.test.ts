import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { runInNewContext } from 'node:vm';
import { describe, expect, it } from 'vitest';
import type { FormDefinition } from '../../src';
import { type parseFormData, renderToStaticMarkup } from '../../src/html';
import { freshBuild } from '../fresh-build';

const iifePath = join(__dirname, '../../dist/html.iife.js');

const definition: FormDefinition = {
  formatVersion: '1.8',
  id: 'contact',
  title: 'Contact',
  submit: { label: 'Send' },
  fields: [
    { key: 'name', type: 'text', label: 'Name', validation: { required: true, pattern: '^[A-Z]' } },
    { key: 'topic', type: 'select', label: 'Topic', options: [{ value: 'a', label: 'A', image: 'https://example.com/a.png' }] },
    { key: 'note', type: 'textarea', label: 'Note <b>' },
  ],
};

describe.skipIf(!freshBuild(iifePath))('static markup IIFE', () => {
  it('runs in a context with no DOM, Node or web APIs', () => {
    const context: { FormhausHtml?: { renderToStaticMarkup: typeof renderToStaticMarkup }; process?: unknown } = {};
    runInNewContext(readFileSync(iifePath, 'utf8'), context);
    const options = { values: { name: 'Ada' }, errors: { note: 'Too long' }, action: '/send' };
    expect(context.FormhausHtml!.renderToStaticMarkup(definition, options)).toBe(renderToStaticMarkup(definition, options));
  });

  it('takes a definition parsed from JSON', () => {
    const context: { FormhausHtml?: { renderToStaticMarkup: typeof renderToStaticMarkup } } = {};
    runInNewContext(readFileSync(iifePath, 'utf8'), context);
    const parsed = JSON.parse(JSON.stringify(definition));
    expect(context.FormhausHtml!.renderToStaticMarkup(parsed, {})).toBe(renderToStaticMarkup(definition, {}));
  });

  it('parses a post', () => {
    const context: { FormhausHtml?: { parseFormData: typeof parseFormData } } = {};
    runInNewContext(readFileSync(iifePath, 'utf8'), context);
    expect(JSON.parse(JSON.stringify(context.FormhausHtml!.parseFormData(definition, { name: 'Ada' })))).toEqual({ name: 'Ada' });
  });
});

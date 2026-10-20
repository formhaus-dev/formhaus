import { readFileSync, readdirSync } from 'node:fs';
import { resolve } from 'node:path';
import Ajv from 'ajv';
import { describe, expect, it } from 'vitest';
import { checkDefinition, FormEngine } from '../../src';
import { validateSubmission } from '../../src/server';
import { buildIndex } from '../../../../scripts/templates-index.mjs';

const directory = resolve(__dirname, '../../../../templates');
const files = readdirSync(directory).filter((name) => name.endsWith('.json') && !['index.json', 'order.json'].includes(name));
const read = (name: string) => JSON.parse(readFileSync(resolve(directory, name), 'utf8'));
const templates = files.map((file) => ({ file, template: read(file) }));
const schema = JSON.parse(readFileSync(resolve(__dirname, '../../schema/form-definition.schema.json'), 'utf8'));
const validate = new Ajv({ allErrors: true, allowUnionTypes: true }).compile(schema);
const categories = ['lead-gen', 'intake', 'application', 'feedback', 'survey', 'registration', 'quiz', 'operations'];

describe('form templates', () => {
  it('has templates', () => {
    expect(templates.length).toBeGreaterThan(0);
  });

  it('has unique slugs', () => {
    const slugs = templates.map(({ template }) => template.slug);
    expect(new Set(slugs).size).toBe(slugs.length);
  });

  it('lists every template exactly once in order.json', () => {
    const order = read('order.json');
    expect(new Set(order).size).toBe(order.length);
    expect([...order].sort()).toEqual(templates.map(({ template }) => template.slug).sort());
  });

  it('has an up-to-date index', () => {
    expect(read('index.json')).toEqual(buildIndex(templates.map(({ template }) => template)));
  });

  it.each(templates)('$file has a valid shape', ({ file, template }) => {
    expect(Object.keys(template).sort()).toEqual(['category', 'definition', 'slug', 'summary', 'title']);
    expect(template.slug).toMatch(/^[a-z0-9]+(-[a-z0-9]+)*$/);
    expect(`${template.slug}.json`).toBe(file);
    expect(template.title.trim()).not.toBe('');
    expect(template.summary.length).toBeLessThanOrEqual(110);
    expect(categories).toContain(template.category);
  });

  it.each(templates)('$file has a valid definition', ({ template }) => {
    expect(validate(template.definition), JSON.stringify(validate.errors)).toBe(true);
    expect(checkDefinition(template.definition).map((issue) => issue.message)).toEqual([]);
    expect(() => new FormEngine(template.definition)).not.toThrow();
  });
});

describe('return-request evidence', () => {
  const { definition } = read('return-request.json');
  const item = (reason: string, extra: Record<string, unknown> = {}) => ({
    item: 'Shirt',
    quantity: 1,
    reason,
    condition: 'used',
    resolution: 'refund',
    details: 'x',
    ...extra,
  });
  const base = { orderNumber: '1', email: 'a@b.co', name: 'A', returnMethod: 'label' };

  it('requires a photo link for a damaged item on the server', () => {
    const missing = validateSubmission(definition, { ...base, items: [item('fit'), item('damaged')] });
    expect(missing.errors).toEqual({ 'items.1.damageLink': expect.any(String) });
    const fixed = validateSubmission(definition, { ...base, items: [item('fit'), item('damaged', { damageLink: 'https://x.co/a' })] });
    expect(fixed.errors).toEqual({});
  });

  it('requires a photo link for a damaged item in the client', () => {
    const engine = new FormEngine(definition);
    engine.setValue('items.0.reason', 'damaged');
    expect(engine.validate()).toHaveProperty(['items.0.damageLink']);
    engine.setValue('items.0.reason', 'fit');
    expect(engine.validate()).not.toHaveProperty(['items.0.damageLink']);
  });
});

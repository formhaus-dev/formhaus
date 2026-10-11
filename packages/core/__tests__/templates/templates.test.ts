import { readFileSync, readdirSync } from 'node:fs';
import { resolve } from 'node:path';
import Ajv from 'ajv';
import { describe, expect, it } from 'vitest';
import { FormEngine, validateDefinition } from '../../src';
import { buildIndex } from '../../../../scripts/templates-index.mjs';

const directory = resolve(__dirname, '../../../../templates');
const files = readdirSync(directory).filter((name) => name.endsWith('.json') && name !== 'index.json');
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
    expect(validateDefinition(template.definition)).toEqual([]);
    expect(() => new FormEngine(template.definition)).not.toThrow();
  });
});

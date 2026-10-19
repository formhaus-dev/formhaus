import { describe, expect, it } from 'vitest';
import type { FormDefinition } from '@formhaus/core';
import { findIssues, fromDefinition, isPage, isQuestion, syncIdentifiers, toDefinition } from '../src';
import { examples, normalize, recipes, templates } from './fixtures';

describe('round trip', () => {
  it('covers every template', () => {
    expect(templates.length).toBeGreaterThanOrEqual(40);
  });

  it.each([...templates, ...recipes])('%s survives fromDefinition and toDefinition', (_name, definition) => {
    expect(normalize(toDefinition(fromDefinition(definition)))).toEqual(normalize(definition));
  });

  it('covers the example definitions', () => {
    expect(examples.length).toBeGreaterThanOrEqual(14);
  });

  it.each([...templates, ...recipes, ...examples])('%s exports byte for byte when nothing is edited', (_name, definition) => {
    expect(JSON.stringify(toDefinition(fromDefinition(definition)), null, 2)).toBe(JSON.stringify(definition, null, 2));
  });

  it.each([...templates, ...recipes])('%s keeps every identifier after a sync', (_name, definition) => {
    const form = fromDefinition(definition);
    syncIdentifiers(form);
    expect(normalize(toDefinition(form))).toEqual(normalize(definition));
  });

  it.each(templates)('%s locks every identifier of the published version', (_name, definition) => {
    const form = fromDefinition(definition, { lockedFrom: definition });
    for (const block of form.blocks) {
      if (isPage(block)) expect(block.idLocked).toBe(true);
      if (isQuestion(block)) {
        expect(block.keyLocked).toBe(true);
        for (const option of block.options) expect(option.valueLocked).toBe(true);
      }
    }
  });

  it('keeps a hidden field without a label', () => {
    const definition = { id: 'f', title: 'F', submit: { label: 'Send' }, fields: [{ key: 'utm', type: 'hidden' }] } as FormDefinition;
    const form = fromDefinition(definition);
    expect(findIssues(form)).toEqual([]);
    expect(JSON.stringify(toDefinition(form))).toBe(JSON.stringify(definition));
  });

  it('keeps formatVersion', () => {
    const [, definition] = templates[0];
    const versioned = { ...definition, formatVersion: '1.0' };
    expect(toDefinition(fromDefinition(versioned)).formatVersion).toBe('1.0');
    expect(normalize(toDefinition(fromDefinition(versioned)))).toEqual(normalize(versioned));
  });

  it('assigns deterministic uids per form', () => {
    const [, definition] = templates[0];
    const first = fromDefinition(definition).blocks.map((block) => block.uid);
    const second = fromDefinition(definition).blocks.map((block) => block.uid);
    expect(first).toEqual(second);
  });
});

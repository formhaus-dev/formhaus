import { describe, expect, it } from 'vitest';
import { capabilitiesTool } from '../src/capabilities';
import { exampleDefinitionsTool } from '../src/examples';
import { validateDefinitionTool } from '../src/validate';

describe('capabilities', () => {
  it('describes field types, rules, operators and routes', () => {
    const result = capabilitiesTool();
    expect(result.fieldTypes).toContain('radio');
    expect(result.validationRules.rules).toContain('matchField');
    expect(result.conditions.operators).toEqual(['eq', 'neq', 'in', 'notIn', 'notEmpty']);
    expect(result.steps.routes.join(' ')).toMatch(/to: null/);
    expect(result.adapters.map(({ name }) => name)).toContain('@formhaus/react');
  });
});

describe('example_definitions', () => {
  it('lists examples and returns valid definitions', async () => {
    const listed = exampleDefinitionsTool({});
    if (!('examples' in listed)) throw new Error('expected a list');
    expect(listed.examples.length).toBeGreaterThan(0);
    for (const { id } of listed.examples) {
      const result = exampleDefinitionsTool({ id });
      if (!('definition' in result)) throw new Error(`missing ${id}`);
      expect((await validateDefinitionTool({ definition: result.definition })).errors).toEqual([]);
    }
  });

  it('reports an unknown id', () => {
    expect(exampleDefinitionsTool({ id: 'nope' })).toHaveProperty('error');
  });
});

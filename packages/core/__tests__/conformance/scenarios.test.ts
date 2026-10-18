import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import Ajv from 'ajv';
import { describe, expect, it } from 'vitest';
import { FormEngine } from '../../src';
import { ScenarioRun, scenarioFiles } from './scenarios';

const schema = JSON.parse(readFileSync(join(__dirname, '../../fixtures/conformance/scenarios/scenario.schema.json'), 'utf8'));
const validate = new Ajv({ allErrors: true, allowUnionTypes: true }).compile(schema);

describe.each(scenarioFiles.map((file) => [file.name, file] as const))('scenarios: %s', (_, file) => {
  it('matches the scenario schema', () => {
    expect(validate(file) ? [] : validate.errors).toEqual([]);
  });

  it.each(file.scenarios.map((scenario) => [scenario.name, scenario] as const))('%s', async (_, scenario) => {
    if (scenario.throws) {
      expect(() => new FormEngine(file.definition, scenario.values ?? {})).toThrow(expect.objectContaining({ name: scenario.throws }));
      return;
    }
    expect(await new ScenarioRun(file, scenario).run()).toEqual([]);
  });
});

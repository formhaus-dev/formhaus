import { fileURLToPath } from 'node:url';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { FormDefinitionError, FormEngine, parseDefinition, type FormDefinition } from '../../src';
import { shapeIssues } from '../../src/definition-validation/shape';
import { validateSubmission } from '../../src/server';
import { bundleSize, TRUSTED } from '../../../../scripts/size/measure.mjs';

vi.mock('../../src/definition-validation/shape', async (original) => {
  const shape = await original<typeof import('../../src/definition-validation/shape')>();
  return { ...shape, shapeIssues: vi.fn(shape.shapeIssues) };
});

const form = (validation: object = {}): FormDefinition => ({
  id: 'trusted',
  title: 'Trusted',
  submit: { label: 'Send' },
  fields: [{ key: 'name', type: 'text', label: 'Name', validation }],
});

const invalid = () => form({ pattern: '(' });

function production(trusted?: string) {
  vi.stubEnv('NODE_ENV', 'production');
  if (trusted) vi.stubEnv('FORMHAUS_TRUSTED', trusted);
}

afterEach(() => {
  vi.unstubAllEnvs();
  vi.mocked(shapeIssues).mockClear();
});

describe('trusted definitions', () => {
  it('checks a parsed definition once in production', () => {
    production();
    const definition = parseDefinition(form());
    const engine = new FormEngine(definition);
    engine.replaceDefinition(definition);
    expect(shapeIssues).toHaveBeenCalledTimes(1);
  });

  it('checks a definition that was not parsed in production', () => {
    production();
    const engine = new FormEngine(form());
    expect(() => engine.replaceDefinition(invalid())).toThrow(FormDefinitionError);
    expect(shapeIssues).toHaveBeenCalledTimes(2);
  });

  it('skips the production check when FORMHAUS_TRUSTED is "1"', () => {
    production('1');
    const engine = new FormEngine(invalid());
    expect(() => engine.replaceDefinition(invalid())).not.toThrow();
    expect(shapeIssues).not.toHaveBeenCalled();
  });

  it('keeps the production check for other FORMHAUS_TRUSTED values', () => {
    production('true');
    expect(() => new FormEngine(invalid())).toThrow(FormDefinitionError);
  });

  it('still checks in development when FORMHAUS_TRUSTED is "1"', () => {
    vi.stubEnv('FORMHAUS_TRUSTED', '1');
    expect(() => new FormEngine(invalid())).toThrow(FormDefinitionError);
  });

  it('still warns in development about a parsed definition', () => {
    const onWarning = vi.fn();
    new FormEngine(parseDefinition(form({ validator: 'known' })), {}, { validators: {}, onWarning });
    expect(onWarning).toHaveBeenCalledWith(expect.objectContaining({ code: 'unknown-validator' }));
  });

  it('keeps the production check for a definition passed to validateSubmission', () => {
    production();
    const definition = form();
    validateSubmission(definition, { name: 'Ada' });
    Object.assign(definition.fields![0], { validation: { pattern: '(' } });
    expect(() => new FormEngine(definition)).toThrow(FormDefinitionError);
  });

  it.each(['development', 'production'])('checks once in validateSubmission in %s', (mode) => {
    vi.stubEnv('NODE_ENV', mode);
    const definition: FormDefinition = {
      id: 'steps',
      title: 'Steps',
      submit: { label: 'Send' },
      steps: [
        { id: 'a', title: 'A', skip: { label: 'Skip' }, fields: [{ key: 'x', type: 'text', label: 'X' }] },
        { id: 'b', title: 'B', skip: { label: 'Skip' }, fields: [{ key: 'y', type: 'text', label: 'Y' }] },
        { id: 'c', title: 'C', fields: [{ key: 'z', type: 'text', label: 'Z' }] },
      ],
    };
    validateSubmission(definition, { z: 'z' }, { skippedSteps: ['a', 'b'] });
    expect(shapeIssues).toHaveBeenCalledTimes(1);
  });

  it('drops the structure check from a bundle built with FORMHAUS_TRUSTED', async () => {
    const options = { resolveDir: fileURLToPath(new URL('../..', import.meta.url)) };
    const contents = "export { FormEngine } from './src/index.ts';";
    const checked = await bundleSize(contents, options);
    const trusted = await bundleSize(contents, { ...options, define: TRUSTED });
    expect(checked - trusted).toBeGreaterThan(3584);
  });
});

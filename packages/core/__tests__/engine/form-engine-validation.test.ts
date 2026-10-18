import { describe, expect, it } from 'vitest';
import { FormEngine } from '../../src/engine';
import type { FormDefinition } from '../../src/types';

describe('FormEngine validation and errors', () => {
  it('moves to the step with the error when submit fails', async () => {
    const definition: FormDefinition = {
      id: 'earlier-step-error',
      title: 'Earlier step error',
      submit: { label: 'Submit' },
      steps: [
        { id: 's1', title: 'One', fields: [{ key: 'x', type: 'text', label: 'X', validation: { validator: 'notWithY' } }] },
        { id: 's2', title: 'Two', fields: [{ key: 'y', type: 'text', label: 'Y' }] },
      ],
    };
    const validators = { notWithY: (_: unknown, values: Record<string, unknown>) => (values.y === 'yes' ? 'Not with y' : null) };
    const engine = new FormEngine(definition, { x: 'a' }, { validators });
    await engine.next();
    engine.setValue('y', 'yes');

    expect(await engine.submit(() => {})).toBe(false);
    expect(engine.currentStep?.id).toBe('s1');
    expect(engine.errors.x).toBe('Not with y');
  });
});

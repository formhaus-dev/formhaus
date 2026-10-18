import { expect, it } from 'vitest';
import { FormEngine } from '../../src/engine';
import { routedDefinition } from './form-engine-routes.fixtures';

it('keeps validation values and canGoNext consistent on a routed path', async () => {
  const definition = routedDefinition();
  definition.steps![2].fields[0].validation = { validator: 'activeOnly' };
  const engine = new FormEngine(
    definition,
    { kind: 'personal', company: 'Retained', name: 'Ada' },
    {
      validators: { activeOnly: (_value, values) => (values.company ? 'Inactive value leaked' : null) },
    },
  );
  await engine.next();
  expect(engine.canGoNext).toBe(true);
  expect(engine.validate()).toEqual({});
});

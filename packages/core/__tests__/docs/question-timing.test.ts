import { expect, it } from 'vitest';
import definition from '../../../../docs/recipes/definitions/survey.json';
import { questionTimer } from '../../../../docs/recipes/snippets/question-timing';
import type { FormDefinition } from '../../src';
import { FormEngine } from '../../src/engine';

it('measures time per question from form events', async () => {
  let clock = 0;
  const times: [string, number][] = [];
  const timer = questionTimer(
    (stepId, ms) => times.push([stepId, ms]),
    () => clock,
  );
  const engine = new FormEngine(definition as FormDefinition, {}, { onFormEvent: timer });
  engine.start();
  clock = 1200;
  engine.setValue('role', 'designer');
  await engine.next();
  clock = 4000;
  engine.setValue('team', 4);
  await engine.next();
  clock = 9000;
  await engine.submit(() => ({ ok: false, formErrors: ['Try again'] }));
  clock = 9500;
  await engine.submit(() => {});
  expect(times).toEqual([
    ['role', 1200],
    ['team', 2800],
    ['feedback', 5000],
    ['feedback', 500],
  ]);
});

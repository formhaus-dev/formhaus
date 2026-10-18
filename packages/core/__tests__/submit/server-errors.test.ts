import { expect, it } from 'vitest';
import { FormEngine } from '../../src';

it('reports step errors for step ids that shadow object properties', () => {
  const engine = new FormEngine({
    id: 'reserved',
    title: 'Reserved',
    submit: { label: 'Send' },
    steps: [
      { id: 'constructor', title: 'One', fields: [{ key: 'a', type: 'text', label: 'A' }] },
      { id: '__proto__', title: 'Two', fields: [{ key: 'b', type: 'text', label: 'B' }] },
    ],
  });
  engine.setErrors({ b: 'Bad' });
  expect(engine.stepErrors.constructor).toBeUndefined();
  expect(Object.keys(engine.stepErrors)).toEqual(['__proto__']);
  expect(JSON.parse(JSON.stringify(engine.stepErrors))).toEqual(JSON.parse('{"__proto__":["b"]}'));
});

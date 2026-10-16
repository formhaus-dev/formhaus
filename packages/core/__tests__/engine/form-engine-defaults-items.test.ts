import { describe, expect, it } from 'vitest';
import { FormEngine } from '../../src/engine';
import type { FormDefinition, FormField } from '../../src/types';

describe('defaults of item fields and of steps reached through restored routes', () => {
  const crew: FormDefinition = {
    id: 'crew',
    title: 'Crew',
    submit: { label: 'Send' },
    fields: [
      { key: 'on', type: 'checkbox', label: 'On' },
      { key: 'partySize', type: 'number', label: 'Party', defaultValue: 1, show: [{ field: 'on', eq: true }] },
      {
        key: 'crew',
        type: 'group',
        label: 'Crew',
        fields: [
          { key: 'kind', type: 'text', label: 'Kind' },
          { key: 'count', type: 'number', label: 'Count', defaultValue: 1, show: [{ field: 'kind', eq: 'x' }] },
        ],
      },
    ],
  };

  it('gives item fields of initial items their defaults like top-level fields', () => {
    const engine = new FormEngine(crew, { on: false, crew: [{ kind: 'y' }] });
    engine.setValue('on', true);
    expect(engine.values.partySize).toBe(1);
    engine.setValue('crew.0.kind', 'x');
    expect(engine.values.crew).toEqual([{ kind: 'x', count: 1 }]);
    expect(new FormEngine(crew, { crew: [{ kind: 'x' }] }).values.crew).toEqual([{ kind: 'x', count: 1 }]);
    expect(new FormEngine(crew, { crew: [{ kind: 'x', count: 3 }] }).values.crew).toEqual([{ kind: 'x', count: 3 }]);
  });

  it('gives item fields of reset items their defaults', () => {
    const engine = new FormEngine(crew);
    engine.reset({ crew: [{ kind: 'x' }] });
    expect(engine.values.crew).toEqual([{ kind: 'x', count: 1 }]);
  });

  it('restores defaults on a step that a restored route makes reachable', () => {
    const definition: FormDefinition = {
      id: 'reach',
      title: 'Reach',
      submit: { label: 'Send' },
      steps: [
        { id: 's1', title: 'One', fields: [{ key: 'x', type: 'checkbox', label: 'X' }] },
        {
          id: 's2',
          title: 'Two',
          show: [{ field: 'x', eq: true }],
          fields: [{ key: 'a', type: 'checkbox', label: 'A', defaultValue: true }],
          routes: [{ to: 's3', show: [{ field: 'a', eq: true }] }, { to: 's4' }],
        },
        {
          id: 's3',
          title: 'Three',
          fields: [{ key: 'c', type: 'number', label: 'C', defaultValue: 1, show: [{ field: 'x', eq: true }] }],
        },
        { id: 's4', title: 'Four', fields: [{ key: 'd', type: 'text', label: 'D' }] },
      ],
    };
    const engine = new FormEngine(definition);
    engine.setValue('x', true);
    expect(engine.values).toMatchObject({ x: true, a: true, c: 1 });
    expect(engine.getSubmitValues()).toEqual({ x: true, a: true, c: 1 });
  });
});

describe('defaults of a key declared on two routes', () => {
  const branches = (field: (branch: 'a' | 'b') => FormField): FormDefinition => ({
    id: 'branches',
    title: 'Branches',
    submit: { label: 'Send' },
    steps: [
      {
        id: 'pick',
        title: 'Pick',
        fields: [
          {
            key: 'route',
            type: 'radio',
            label: 'Route',
            options: [
              { value: 'a', label: 'A' },
              { value: 'b', label: 'B' },
            ],
          },
        ],
        routes: [{ to: 'b', show: [{ field: 'route', eq: 'b' }] }],
      },
      { id: 'a', title: 'A', fields: [field('a')], routes: [{ to: null }] },
      { id: 'b', title: 'B', fields: [field('b')] },
    ],
  });
  const n = (branch: 'a' | 'b'): FormField => ({ key: 'n', type: 'number', label: 'N', defaultValue: branch === 'a' ? 1 : 2 });
  const group = (branch: 'a' | 'b'): FormField => ({
    key: 'g',
    type: 'group',
    label: 'G',
    defaultItems: branch === 'a' ? 1 : 2,
    fields: [n(branch)],
  });

  it('fills initial items with the item defaults of the active route', () => {
    expect(new FormEngine(branches(group), { route: 'b', g: [{}] }).getSubmitValues()).toEqual({ route: 'b', g: [{ n: 2 }] });
    expect(new FormEngine(branches(group), { route: 'a', g: [{}] }).getSubmitValues()).toEqual({ route: 'a', g: [{ n: 1 }] });
  });

  it('fills reset items with the item defaults of the active route', () => {
    const engine = new FormEngine(branches(group));
    engine.reset({ route: 'b', g: [{}, { n: 5 }] });
    expect(engine.getSubmitValues()).toEqual({ route: 'b', g: [{ n: 2 }, { n: 5 }] });
  });

  it('takes the default and the default items of the active route', () => {
    expect(new FormEngine(branches(n), { route: 'a' }).getSubmitValues()).toEqual({ route: 'a', n: 1 });
    expect(new FormEngine(branches(n), { route: 'b' }).getSubmitValues()).toEqual({ route: 'b', n: 2 });
    expect(new FormEngine(branches(group), { route: 'a' }).getSubmitValues()).toEqual({ route: 'a', g: [{ n: 1 }] });
  });
});

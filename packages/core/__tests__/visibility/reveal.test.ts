import { describe, expect, it } from 'vitest';
import { type FormField, type FormNode, revealTargets } from '../../src';

function revealedFields(nodes: FormNode[]): Record<string, Record<string, string[]>> {
  const result: Record<string, Record<string, string[]>> = {};
  revealTargets(nodes).forEach((target, index) => {
    if (!target) return;
    const parent = nodes[target.parent] as FormField;
    const options = (result[parent.key] ??= {});
    (options[parent.options![target.option].value] ??= []).push(nodes[index].key);
  });
  return result;
}

const options = (...values: string[]) => values.map((value) => ({ value, label: value }));
const radio = (key: string, extra: object = {}): FormNode => ({
  key,
  type: 'radio',
  label: key,
  options: options('a', 'b', 'c'),
  ...extra,
});
const boxes = (key: string, extra: object = {}): FormNode => ({
  key,
  type: 'multiselect',
  label: key,
  options: options('a', 'b', 'c'),
  ...extra,
});
const text = (key: string, show?: object[], showAny?: object[]): FormNode =>
  ({ key, type: 'text', label: key, ...(show && { show }), ...(showAny && { showAny }) }) as FormNode;

describe('revealedFields', () => {
  it('nests fields under the radio option their only condition names', () => {
    const nodes = [
      radio('contact'),
      text('email', [{ field: 'contact', eq: 'a' }]),
      text('confirm', [{ field: 'contact', eq: 'a' }]),
      text('phone', [{ field: 'contact', eq: 'b' }]),
    ];
    expect(revealedFields(nodes)).toEqual({ contact: { a: ['email', 'confirm'], b: ['phone'] } });
  });

  it('accepts radio children in any option order', () => {
    const nodes = [radio('r'), text('x', [{ field: 'r', eq: 'b' }]), text('y', [{ field: 'r', eq: 'a' }])];
    expect(revealedFields(nodes)).toEqual({ r: { b: ['x'], a: ['y'] } });
  });

  it('nests multiselect fields by contains in option order only', () => {
    const nodes = [
      boxes('m'),
      text('x', [{ field: 'm', contains: 'a' }]),
      text('y', [{ field: 'm', contains: 'c' }]),
      text('z', [{ field: 'm', contains: 'b' }]),
    ];
    expect(revealedFields(nodes)).toEqual({ m: { a: ['x'], c: ['y'] } });
  });

  it('keeps one option per randomized multiselect', () => {
    const nodes = [
      boxes('m', { randomize: true }),
      text('x', [{ field: 'm', contains: 'a' }]),
      text('y', [{ field: 'm', contains: 'a' }]),
      text('z', [{ field: 'm', contains: 'b' }]),
    ];
    expect(revealedFields(nodes)).toEqual({ m: { a: ['x', 'y'] } });
    expect(
      revealedFields([radio('r', { randomize: true }), text('x', [{ field: 'r', eq: 'b' }]), text('y', [{ field: 'r', eq: 'a' }])]),
    ).toEqual({
      r: { b: ['x'], a: ['y'] },
    });
  });

  it('counts a single showAny condition like show', () => {
    expect(revealedFields([radio('r'), text('x', undefined, [{ field: 'r', eq: 'a' }])])).toEqual({ r: { a: ['x'] } });
  });

  it('ends the run at a field with other conditions', () => {
    const nodes = [
      radio('r'),
      text('x', [{ field: 'r', eq: 'a' }]),
      text('and', [
        { field: 'r', eq: 'a' },
        { field: 'x', notEmpty: true },
      ]),
      text('y', [{ field: 'r', eq: 'b' }]),
    ];
    expect(revealedFields(nodes)).toEqual({ r: { a: ['x'] } });
    expect(revealedFields([radio('r'), text('both', [{ field: 'r', eq: 'a' }], [{ field: 'r', eq: 'b' }])])).toEqual({});
    expect(revealedFields([radio('r'), text('in', [{ field: 'r', in: ['a'] }])])).toEqual({});
    expect(revealedFields([radio('r'), text('neq', [{ field: 'r', neq: 'a' }])])).toEqual({});
    expect(revealedFields([boxes('m'), text('eq', [{ field: 'm', eq: 'a' }])])).toEqual({});
    expect(revealedFields([radio('r'), text('contains', [{ field: 'r', contains: 'a' }])])).toEqual({});
  });

  it('needs the child right after the parent or its other children', () => {
    expect(revealedFields([radio('r'), text('gap'), text('x', [{ field: 'r', eq: 'a' }])])).toEqual({});
    expect(revealedFields([text('x', [{ field: 'r', eq: 'a' }]), radio('r')])).toEqual({});
  });

  it('ignores values that are not options', () => {
    expect(revealedFields([radio('r'), text('x', [{ field: 'r', eq: 'z' }])])).toEqual({});
    expect(revealedFields([radio('r', { options: options('1') }), text('x', [{ field: 'r', eq: 1 }])])).toEqual({});
  });

  it('skips parents that cannot nest', () => {
    const child = text('x', [{ field: 'r', eq: 'a' }]);
    for (const extra of [
      { layout: 'inline' },
      { optionsFrom: 'list' },
      { options: [] },
      { options: [{ value: 'a', label: 'A', image: 'https://example.com/a.png' }] },
    ])
      expect(revealedFields([radio('r', extra), child])).toEqual({});
    expect(revealedFields([{ key: 'r', type: 'select', label: 'r', options: options('a') }, child])).toEqual({});
  });

  it('never nests groups, sections or hidden fields', () => {
    const show = [{ field: 'r', eq: 'a' }];
    const nodes = [
      radio('r'),
      { key: 'h', type: 'hidden', show },
      { key: 'g', type: 'group', label: 'G', show, fields: [] },
      { key: 's', type: 'section', title: 'S', show, fields: [] },
    ] as FormNode[];
    expect(revealedFields(nodes)).toEqual({});
  });

  it('nests a revealed choice field and its own children', () => {
    const nodes = [
      radio('e'),
      radio('f', { show: [{ field: 'e', eq: 'a' }] }),
      text('c', [{ field: 'f', eq: 'b' }]),
      text('d', [{ field: 'e', eq: 'a' }]),
    ];
    expect(revealedFields(nodes)).toEqual({ e: { a: ['f'] }, f: { b: ['c'] } });
  });

  it('marks each revealed node with its parent index and option index', () => {
    const nodes = [text('a'), radio('r'), text('x', [{ field: 'r', eq: 'c' }]), text('b')];
    expect(revealTargets(nodes)).toEqual([null, null, { parent: 1, option: 2 }, null]);
  });

  it('attaches a child to the nearest parent with its key', () => {
    const nodes = [radio('r'), text('x', [{ field: 'r', eq: 'a' }]), radio('r'), text('y', [{ field: 'r', eq: 'b' }])];
    expect(revealTargets(nodes)).toEqual([null, { parent: 0, option: 0 }, null, { parent: 2, option: 1 }]);
  });

  it('reads the operator the way the engine does', () => {
    expect(revealTargets([radio('r'), text('x', [{ field: 'r', eq: 'a', in: ['b'] } as never])])[1]).toEqual({ parent: 0, option: 0 });
    expect(revealTargets([radio('r'), text('x', [{ field: 'r', in: ['b'], contains: 'a' } as never])])[1]).toBeNull();
  });
});

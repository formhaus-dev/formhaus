import type { FormStep } from '@formhaus/core';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { optionTargets, routeTarget, wirePrototype } from '../flow/prototype';

const steps: FormStep[] = [
  { id: 'kind', title: 'Kind', fields: [{ key: 'kind', type: 'radio', label: 'Kind', options: [{ value: 'business', label: 'Business' }, { value: 'personal', label: 'Personal' }, { value: 'done', label: 'Nothing' }] }],
    routes: [{ to: 'business', show: [{ field: 'kind', eq: 'business' }] }, { to: null, show: [{ field: 'kind', eq: 'done' }] }] },
  { id: 'personal', title: 'Personal', fields: [{ key: 'name', type: 'text', label: 'Name' }] },
  { id: 'business', title: 'Business', fields: [{ key: 'company', type: 'text', label: 'Company' }], routes: [{ to: 'kind' }] },
];

describe('prototype targets', () => {
  it('follows the first matching route and falls through to the next step', () => {
    expect(routeTarget(steps, 0, {})).toBe('personal');
    expect(routeTarget(steps, 0, { kind: 'business' })).toBe('business');
    expect(routeTarget(steps, 0, { kind: 'done' })).toBeNull();
  });

  it('ignores backward routes and ends after the last step', () => {
    expect(routeTarget(steps, 2, {})).toBeNull();
  });

  it('maps each option of a routed radio to its destination', () => {
    expect([...optionTargets(steps, 0).get('kind')!]).toEqual([['business', 'business'], ['personal', 'personal'], ['done', null]]);
    expect(optionTargets(steps, 1).size).toBe(0);
  });

  it('skips steps hidden for the given answers and wires auto-advancing radios', () => {
    const gated: FormStep[] = [
      { id: 'intro', title: 'Intro', fields: [{ key: 'extras', type: 'radio', label: 'Extras?', autoAdvance: true, options: [{ value: 'yes', label: 'Yes' }, { value: 'no', label: 'No' }] }] },
      { id: 'extras', title: 'Extras', fields: [], show: [{ field: 'extras', eq: 'yes' }] },
      { id: 'review', title: 'Review', fields: [] },
    ];
    expect(routeTarget(gated, 0, {})).toBe('review');
    expect([...optionTargets(gated, 0).get('extras')!]).toEqual([['yes', 'extras'], ['no', 'review']]);
  });
});

describe('wirePrototype', () => {
  afterEach(() => vi.unstubAllGlobals());

  const tagged = (action: string) => ({ action, getSharedPluginData: () => action, setReactionsAsync: vi.fn() });

  it('links buttons and routed options to their frames and sets one starting point', async () => {
    const page = { flowStartingPoints: [{ nodeId: 'old', name: 'Kind' }] };
    vi.stubGlobal('figma', { currentPage: page, getNodeByIdAsync: async () => ({ removed: false }) });
    const options = ['business', 'personal', 'done'].map((name) => ({ type: 'INSTANCE', name, setReactionsAsync: vi.fn() }));
    const group = { findAll: (match: (node: unknown) => boolean) => options.filter(match) };
    const buttons = [tagged('next'), tagged('back')];
    const frames = steps.map((step, index) => ({
      id: `frame-${step.id}`,
      findAll: (match: (node: unknown) => boolean) => (index === 0 ? [buttons[0]] : [buttons[1]]).filter(match),
      findChild: (match: (node: { name: string }) => boolean) => (index === 0 && match({ name: 'kind' }) ? group : null),
    })) as unknown as FrameNode[];
    await wirePrototype({ id: 'kind', title: 'Kind', submit: { label: 'Go' }, steps }, steps, frames);
    const destination = (mock: ReturnType<typeof vi.fn>) => mock.mock.calls[mock.mock.calls.length - 1][0][0]?.actions[0];
    expect(destination(buttons[0].setReactionsAsync).destinationId).toBe('frame-personal');
    expect(destination(buttons[1].setReactionsAsync).type).toBe('BACK');
    expect(options.map((option) => destination(option.setReactionsAsync)?.destinationId)).toEqual(['frame-business', 'frame-personal', undefined]);
    expect(page.flowStartingPoints).toEqual([{ nodeId: 'old', name: 'Kind' }, { nodeId: 'frame-kind', name: 'Kind' }]);
  });
});

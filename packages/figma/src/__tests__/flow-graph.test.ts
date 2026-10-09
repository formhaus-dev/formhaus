import type { FormDefinition } from '@formhaus/core';
import { describe, expect, it } from 'vitest';
import { buildGraph, describeCondition } from '../flow/graph';
import { flowPositions, labelWidth } from '../flow/layout';
import { matchFrames } from '../render-form';

const quiz: FormDefinition = {
  id: 'quiz', title: 'Quiz', submit: { label: 'Done' },
  steps: [
    { id: 'goal', title: 'Goal', fields: [{ key: 'goal', type: 'radio', label: 'What do you need?', options: [{ value: 'leads', label: 'Collect leads' }, { value: 'survey', label: 'Run surveys' }] }],
      routes: [{ to: 'leads', show: [{ field: 'goal', eq: 'leads' }] }, { to: 'survey', show: [{ field: 'goal', eq: 'survey' }] }] },
    { id: 'leads', title: 'Leads', fields: [{ key: 'volume', type: 'number', label: 'Leads a month' }], routes: [{ to: 'contact' }] },
    { id: 'survey', title: 'Survey', fields: [{ key: 'size', type: 'number', label: 'Respondents' }], routes: [{ to: null, show: [{ field: 'size', notEmpty: true }] }] },
    { id: 'contact', title: 'Contact', fields: [{ key: 'email', type: 'email', label: 'Email' }] },
  ],
};

describe('buildGraph', () => {
  it('turns routes into labelled edges with fallthrough and end edges', () => {
    const graph = buildGraph(quiz);
    expect(graph.branching).toBe(true);
    expect(graph.edges).toEqual([
      { from: 'goal', to: 'leads', label: 'What do you need? is Collect leads or Otherwise' },
      { from: 'goal', to: 'survey', label: 'What do you need? is Run surveys' },
      { from: 'leads', to: 'contact', label: '' },
      { from: 'survey', to: null, label: 'Respondents is filled' },
      { from: 'survey', to: 'contact', label: 'Otherwise' },
      { from: 'contact', to: null, label: '' },
    ]);
  });

  it('places each step one column after its deepest predecessor', () => {
    expect([...buildGraph(quiz).depth]).toEqual([['goal', 0], ['leads', 1], ['survey', 1], ['contact', 2]]);
  });

  it('keeps linear forms in a single chain without branching', () => {
    const linear = buildGraph({ id: 'l', title: 'L', submit: { label: 'Go' }, steps: [{ id: 'a', title: 'A', fields: [] }, { id: 'b', title: 'B', fields: [] }] });
    expect(linear.branching).toBe(false);
    expect([...linear.depth]).toEqual([['a', 0], ['b', 1]]);
  });

  it('skips routes core never takes', () => {
    const graph = buildGraph({ id: 'r', title: 'R', submit: { label: 'Go' }, steps: [
      { id: 'a', title: 'A', fields: [], routes: [{ to: 'a' }, { to: 'c', show: [{ field: 'x' }] }, { to: 'b', show: [{ field: 'x', eq: 1 }] }] },
      { id: 'b', title: 'B', fields: [] },
      { id: 'c', title: 'C', fields: [] },
    ] });
    expect(graph.edges.filter((edge) => edge.from === 'a')).toEqual([{ from: 'a', to: 'c', label: '' }]);
  });

  it('describes conditions in the order core evaluates them', () => {
    const fields = new Map();
    expect(describeCondition({ field: 'size', eq: 'large', notEmpty: true }, fields)).toBe('size is large');
    expect(describeCondition({ field: 'size' }, fields)).toBe('');
  });

  it('widens a column gap to fit its longest label', () => {
    const graph = buildGraph(quiz);
    const sizes = new Map(['goal', 'leads', 'survey', 'contact'].map((id) => [id, { width: 400, height: 300 }]));
    const positions = flowPositions(['goal', 'leads', 'survey', 'contact'], graph, sizes, { x: 0, y: 0 });
    expect(positions.get('leads')!.x).toBe(400 + labelWidth('What do you need? is Collect leads or Otherwise') + 112);
    expect(positions.get('survey')).toEqual({ x: positions.get('leads')!.x, y: 420 });
  });
});

describe('matchFrames', () => {
  const frame = (stepId: string) => ({ getSharedPluginData: () => stepId }) as unknown as FrameNode;

  it('matches frames by step id and leaves new steps unplaced', () => {
    const [b, a] = [frame('b'), frame('a')];
    expect(matchFrames(['a', 'new', 'b'], [b, a])).toEqual([a, undefined, b]);
  });

  it('falls back to canvas order for frames without step ids', () => {
    const [first, second] = [frame(''), frame('')];
    expect(matchFrames(['a', 'b'], [first, second])).toEqual([first, second]);
  });
});

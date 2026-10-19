import type { FormDefinition, FormField, FormSection } from '@formhaus/core';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { renderForm } from '../render-form';
import { renderMatrix } from '../render-matrix';
import type { FormRenderer } from '../renderers/types';
import { find, node, renderer, type SceneStub, stubFigma, texts } from './render-fixtures';

const columns = (labels: string[]) => labels.map((label, index) => ({ value: String(index + 1), label }));

function matrix(labels: string[], type = 'radio'): FormSection {
  return {
    key: 'agree',
    type: 'section',
    layout: 'matrix',
    title: 'How much do you agree?',
    fields: [
      { key: 'goals', type, label: 'Goals are clear', options: columns(labels) },
      { key: 'tools', type, label: 'Tools work', options: columns(labels) },
      { key: 'source', type: 'hidden', label: 'Source' },
    ],
  };
}

async function draw(section: FormSection, target: FormRenderer): Promise<SceneStub> {
  const root = await renderMatrix(section, target, async (frame, child) => void frame.appendChild(await target.field(child as FormField)));
  return root as unknown as SceneStub;
}

function names(node: SceneStub | undefined): string[] {
  return (node?.children ?? []).map((child) => child.name);
}

describe('renderMatrix', () => {
  beforeEach(() => {
    vi.unstubAllGlobals();
    stubFigma([]);
  });

  it('draws a table with column headers and a glyph per cell', async () => {
    const field = vi.fn(async () => node() as unknown as SceneNode);
    const root = await draw(matrix(['Disagree', 'Neutral', 'Agree']), renderer(field));
    expect(root.name).toBe('Matrix');
    expect(texts(find(root, 'Header')!)).toEqual(['Disagree', 'Neutral', 'Agree']);
    expect(names(root)).toEqual(['Header', 'goals', 'tools']);
    const row = find(root, 'goals')!;
    expect(find(row, 'Label')?.characters).toBe('Goals are clear');
    expect(names(find(row, 'Cells'))).toEqual(['1', '2', '3']);
    expect(find(row, '1')?.children.map((child) => child.name)).toEqual(['radio']);
    expect(field).not.toHaveBeenCalled();
  });

  it('uses checkbox glyphs for multiselect rows', async () => {
    const root = await draw(
      matrix(['No', 'Yes'], 'multiselect'),
      renderer(async () => node() as unknown as SceneNode),
    );
    expect(find(find(root, 'tools')!, '2')?.children.map((child) => child.name)).toEqual(['checkbox']);
  });

  it('stacks captions under the glyphs when the columns do not fit beside the labels', async () => {
    const labels = ['Strongly disagree', 'Disagree', 'Neutral', 'Agree', 'Strongly agree'];
    const root = await draw(
      matrix(labels),
      renderer(async () => node() as unknown as SceneNode),
    );
    expect(find(root, 'Header')).toBeUndefined();
    const cell = find(find(root, 'goals')!, '5')!;
    expect(names(cell)).toEqual(['radio', 'Caption']);
    expect(find(cell, 'Caption')?.characters).toBe('Strongly agree');
  });

  it('stacks the rows when a header word is wider than its column', async () => {
    const root = await draw(
      matrix(['Disagree', 'Indifferent', 'Agree']),
      renderer(async () => node() as unknown as SceneNode),
    );
    expect(find(root, 'Header')).toBeUndefined();
    expect(find(find(root, 'goals')!, 'Caption')?.characters).toBe('Disagree');
  });

  it('draws rows that are not choice fields with the regular renderer', async () => {
    const field = vi.fn(async (_: FormField) => node({ name: 'note' }) as unknown as SceneNode);
    const section = matrix(['No', 'Yes']);
    section.fields.push({ key: 'note', type: 'text', label: 'Note' });
    const root = await draw(section, renderer(field));
    expect(field.mock.calls.map(([rendered]) => rendered.key)).toEqual(['note']);
    expect(names(root)).toEqual(['Header', 'goals', 'tools', 'note']);
  });
});

describe('empty steps', () => {
  beforeEach(() => {
    vi.unstubAllGlobals();
  });

  it('draws a welcome step with its title, description and button and no fields', async () => {
    const created = stubFigma([]);
    const field = vi.fn(async () => node() as unknown as SceneNode);
    const button = vi.fn(async (label: string) => node({ type: 'FRAME', name: label }) as unknown as SceneNode);
    const definition: FormDefinition = {
      id: 'survey',
      title: 'Survey',
      submit: { label: 'Send' },
      steps: [
        { id: 'welcome', title: 'Welcome', description: 'Two minutes, three questions.', fields: [] },
        { id: 'rate', title: 'Rate', fields: [{ key: 'name', type: 'text', label: 'Name' }] },
      ],
    };
    const [welcome] = (await renderForm(definition, { ...renderer(field), button })) as unknown as SceneStub[];
    expect(created).toContain(welcome);
    expect(texts(welcome)).toEqual(['Step 1 of 2', 'Welcome', 'Two minutes, three questions.']);
    expect(names(find(welcome, 'Actions') ?? welcome)).toContain('Continue');
    expect(field).toHaveBeenCalledTimes(1);
  });

  it('draws a step whose fields are missing', async () => {
    stubFigma([]);
    const definition = {
      id: 'intro',
      title: 'Intro',
      submit: { label: 'Start' },
      steps: [{ id: 'hello', title: 'Hello' }],
    } as unknown as FormDefinition;
    const frames = await renderForm(
      definition,
      renderer(async () => node() as unknown as SceneNode),
    );
    expect(texts(frames[0] as unknown as SceneStub)).toEqual(['Intro']);
  });
});

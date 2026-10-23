import { render, screen } from '@testing-library/vue';
import type { FormDefinition } from '@formhaus/core';
import { defineComponent, h } from 'vue';
import { expect, it } from 'vitest';
import FormRenderer from '../src/FormRenderer.vue';

const definition: FormDefinition = {
  id: 'legacy',
  title: '',
  submit: { label: 'Send' },
  steps: [
    { id: 'one', title: 'One', fields: [{ key: 'name', type: 'text', label: 'Name' }] },
    { id: 'two', title: 'Two', fields: [{ key: 'city', type: 'text', label: 'City' }] },
  ],
};

const plain = (testId: string) => defineComponent({ setup: () => () => h('div', { 'data-testid': testId }) });

const attributes = (testId: string) =>
  screen
    .getByTestId(testId)
    .getAttributeNames()
    .filter((name) => name !== 'data-testid')
    .sort();

const progress = ['counter-label', 'current', 'heading-level', 'step-title', 'total'];
const actions = [
  'back-label',
  'is-first-step',
  'is-last-step',
  'is-multi-step',
  'loading',
  'primary-label',
  'show-back',
  'show-primary',
  'show-skip',
  'skip-label',
  'submit-action',
  'values',
];

it('passes old progress and actions components the 1.2 attributes only', () => {
  render(FormRenderer, { props: { definition, progressComponent: plain('progress'), actionsComponent: plain('actions') } });
  expect(attributes('progress')).toEqual(progress);
  expect(attributes('actions')).toEqual(actions);
});

it('passes steps to an old progress component only with stepErrorMarks', () => {
  render(FormRenderer, { props: { definition, stepErrorMarks: true, progressComponent: plain('progress') } });
  expect(attributes('progress')).toEqual([...progress, 'steps'].sort());
});

it('passes an old section component in a matrix no columns attribute', () => {
  const matrix: FormDefinition = {
    formatVersion: '1.3',
    id: 'matrix',
    title: '',
    submit: { label: 'Send' },
    fields: [
      {
        key: 'rates',
        type: 'section',
        title: 'Rates',
        layout: 'matrix',
        fields: [{ key: 'speed', type: 'radio', label: 'Speed', options: [{ value: 'a', label: 'A' }] }],
      },
    ],
  };
  render(FormRenderer, { props: { definition: matrix, components: { section: plain('section') } } });
  expect(attributes('section')).toEqual(['id', 'section', 'title']);
});

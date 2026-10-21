import { FormEngine, type FormDefinition } from '@formhaus/core';
import { research } from '@formhaus/core/research';

export const plain: FormDefinition = {
  id: 'plain',
  title: 'Contact',
  description: 'We reply within a day.',
  submit: { label: 'Send' },
  fields: [
    { key: 'name', type: 'text', label: 'Name', helperText: 'Full name', validation: { required: true } },
    { key: 'email', type: 'email', label: 'Email' },
    { key: 'message', type: 'textarea', label: 'Message' },
    { key: 'born', type: 'date', label: 'Born' },
  ],
};

export const steps: FormDefinition = {
  id: 'steps',
  title: 'Steps',
  submit: { label: 'Submit' },
  steps: [
    { id: 'one', title: 'Step one', fields: [{ key: 'first', type: 'text', label: 'First' }] },
    { id: 'two', title: 'Step two', fields: [{ key: 'second', type: 'text', label: 'Second' }] },
    { id: 'three', title: 'Step three', fields: [{ key: 'third', type: 'text', label: 'Third' }] },
  ],
};

const colors = [
  { value: 'red', label: 'Red' },
  { value: 'green', label: 'Green' },
  { value: 'blue', label: 'Blue' },
];

export const choices: FormDefinition = {
  id: 'choices',
  title: 'Choices',
  submit: { label: 'Send' },
  fields: [
    { key: 'color', type: 'select', label: 'Color', placeholder: 'Pick one', options: colors },
    { key: 'size', type: 'radio', label: 'Size', options: colors },
    { key: 'terms', type: 'checkbox', label: 'I agree' },
    { key: 'tags', type: 'multiselect', label: 'Tags', options: colors },
    { key: 'country', type: 'autocomplete', label: 'Country', options: colors },
    { key: 'news', type: 'switch', label: 'News' },
    { key: 'at', type: 'time', label: 'At' },
    { key: 'when', type: 'datetime', label: 'When' },
    { key: 'cv', type: 'file', label: 'CV' },
    { key: 'age', type: 'number', label: 'Age' },
  ],
};

export const choiceValues = {
  color: 'green',
  size: 'blue',
  terms: true,
  tags: ['red', 'blue'],
  country: 'blue',
  news: true,
  at: '09:30',
  when: '2026-01-02T09:30',
  age: 42,
};

export const group: FormDefinition = {
  formatVersion: '1.1',
  id: 'group',
  title: 'Team',
  submit: { label: 'Register' },
  fields: [
    {
      key: 'people',
      type: 'group',
      label: 'People',
      itemLabel: 'Person {index}',
      addLabel: 'Add person',
      defaultItems: 1,
      fields: [
        { key: 'name', type: 'text', label: 'Name' },
        { key: 'role', type: 'select', label: 'Role', options: colors },
        { key: 'note', type: 'text', label: 'Note', show: [{ field: 'role', eq: 'red' }] },
      ],
    },
  ],
};

export const groupValues = {
  people: [
    { name: 'Ada', role: 'red', note: 'Lead' },
    { name: 'Alan', role: 'green' },
  ],
};

export const hidden: FormDefinition = {
  id: 'hidden',
  title: 'Hidden',
  submit: { label: 'Send' },
  fields: [
    { key: 'name', type: 'text', label: 'Name' },
    { key: 'plan', type: 'hidden', defaultValue: 'pro' },
    { key: 'utm_source', type: 'hidden', source: { query: 'utm_source' }, defaultValue: 'direct' },
    { key: 'device', type: 'hidden', source: 'device' },
  ],
};

export const conditions: FormDefinition = {
  id: 'conditions',
  title: 'Conditions',
  submit: { label: 'Send' },
  fields: [
    {
      key: 'kind',
      type: 'radio',
      label: 'Kind',
      defaultValue: 'company',
      options: [
        { value: 'person', label: 'Person' },
        { value: 'company', label: 'Company' },
      ],
    },
    { key: 'company', type: 'text', label: 'Company name', show: [{ field: 'kind', eq: 'company' }] },
    { key: 'birthday', type: 'date', label: 'Birthday', show: [{ field: 'kind', eq: 'person' }] },
    {
      key: 'vat',
      type: 'text',
      label: 'VAT number',
      showAny: [
        { field: 'kind', eq: 'person' },
        { field: 'company', eq: 'Acme' },
      ],
    },
  ],
};

const agree = [
  { value: '1', label: 'Disagree' },
  { value: '2', label: 'Neutral' },
  { value: '3', label: 'Agree' },
];

export const questionTypes: FormDefinition = {
  formatVersion: '1.3',
  id: 'question-types',
  title: 'Question types',
  submit: { label: 'Send' },
  fields: [
    {
      key: 'nps',
      type: 'scale',
      label: 'Recommend',
      validation: { min: 0, max: 10 },
      options: [
        { value: '0', label: 'Not at all likely' },
        { value: '10', label: 'Extremely likely' },
      ],
    },
    { key: 'stars', type: 'rating', label: 'Stars' },
    { key: 'room', type: 'radio', label: 'Room', options: [{ value: 'sea', label: 'Sea', image: 'https://example.com/sea.jpg' }] },
    {
      key: 'pulse',
      type: 'section',
      layout: 'matrix',
      title: 'Pulse',
      fields: [
        { key: 'clear', type: 'radio', label: 'Clear', options: agree },
        { key: 'heard', type: 'radio', label: 'Heard', options: agree },
      ],
    },
    { key: 'note', type: 'section', title: 'Thanks', fields: [] },
  ],
};

export const questionValues = { nps: 0, stars: 4, room: 'sea', clear: '3' };

export const randomized: FormDefinition = {
  formatVersion: '1.6',
  id: 'randomized',
  title: 'Randomized',
  submit: { label: 'Send' },
  fields: [
    {
      key: 'tools',
      type: 'radio',
      label: 'Tools',
      randomize: true,
      options: ['Figma', 'Sketch', 'Framer', 'Penpot', 'Other'].map((label) => ({
        value: label.toLowerCase(),
        label,
        pinned: label === 'Other',
      })),
    },
  ],
};

export const writtenOrder = randomized.fields![0].options!.map(({ value }) => value);
export const shownOrder = (seed: string) =>
  new FormEngine(randomized, {}, { seed, research }).orderOptions('tools').map(({ value }) => value);
export const toolValues = (root: ParentNode) =>
  [...root.querySelectorAll<HTMLInputElement>('input[name="tools"]')].map(({ value }) => value);

import type { FormDefinition } from '@formhaus/core';
import { describe, expect, it } from 'vitest';
import { duplicateField, fromDefinition, isQuestion, moveOption, setFormTitle, setRequired, setOptionLabel, toDefinition } from '../src';

const translated = {
  id: 'support',
  title: 'Support',
  lang: 'en',
  i18n: { title: 'support.title', messages: { required: 'errors.required' } },
  submit: { label: 'Send', i18n: { label: 'common.send' } },
  fields: [
    {
      key: 'topic',
      type: 'radio',
      label: 'Topic',
      i18n: { label: 'support.topic' },
      options: [
        { value: 'bug', label: 'Bug', i18n: { label: 'support.topic.bug' }, 'x-color': 'red' },
        { value: 'idea', label: 'Idea', i18n: { label: 'support.topic.idea' } },
        { label: 'Other', value: 'other' },
      ],
      validation: { minLength: 1, required: 'Pick a topic', i18n: { required: 'errors.topic' } },
    },
    { key: 'plan', type: 'select', label: 'Plan', options: [{ value: 'pro', label: 'Pro', i18n: { label: 'plans.pro' } }] },
    { key: 'tags', type: 'multiselect', label: 'Tags', options: [{ value: 'a', label: 'A', i18n: { label: 'tags.a' } }] },
    { key: 'note', type: 'text', label: 'Note', validation: { required: false } },
    { key: 'code', type: 'text', label: 'Code', validation: { required: '' } },
    { type: 'hidden', key: 'ref' },
  ],
} as unknown as FormDefinition;

const json = (value: unknown) => JSON.stringify(value, null, 2);
const fields = (definition: FormDefinition) => definition.fields!;

describe('developer metadata', () => {
  it('exports an unedited translated form byte for byte', () => {
    expect(json(toDefinition(fromDefinition(translated)))).toBe(json(translated));
  });

  it('keeps option translation keys and metadata after a title change', () => {
    const form = fromDefinition(translated);
    setFormTitle(form, 'Help');
    const result = toDefinition(form);
    expect(result.title).toBe('Help');
    expect(json(fields(result).map((field) => field.options))).toBe(json(fields(translated).map((field) => field.options)));
    expect(json({ ...result, title: 'Support' })).toBe(json(translated));
  });

  it('keeps an option translation key when the option is reordered, relabeled or its field duplicated', () => {
    const form = fromDefinition(translated);
    const topic = form.blocks.find(isQuestion)!;
    moveOption(form, topic.uid, topic.options[0].uid, 2);
    setOptionLabel(form, topic.uid, topic.options[0].uid, 'Feature idea');
    const copy = duplicateField(form, topic.uid)!;
    const [source, duplicate] = fields(toDefinition(form)).filter((field) => field.key === 'topic' || field.key === copy.key);
    expect(source.options).toEqual([
      { value: 'idea', label: 'Feature idea', i18n: { label: 'support.topic.idea' } },
      { label: 'Other', value: 'other' },
      { value: 'bug', label: 'Bug', i18n: { label: 'support.topic.bug' }, 'x-color': 'red' },
    ]);
    expect(duplicate.options!.map(({ value: _value, ...rest }) => rest)).toEqual(source.options!.map(({ value: _value, ...rest }) => rest));
    expect(source.i18n).toEqual({ label: 'support.topic' });
  });

  it('keeps inactive required rules and their message when required is toggled', () => {
    const form = fromDefinition(translated);
    const [topic, , , note, code] = form.blocks.filter(isQuestion);
    setRequired(form, topic.uid, false);
    setRequired(form, code.uid, true);
    const result = fields(toDefinition(form));
    expect(result[0].validation).toEqual({ minLength: 1, i18n: { required: 'errors.topic' } });
    expect(result[3].validation).toEqual({ required: false });
    expect(result[4].validation).toEqual({ required: true });
    setRequired(form, topic.uid, true);
    setRequired(form, note.uid, true);
    expect(fields(toDefinition(form))[0].validation).toEqual({
      minLength: 1,
      required: 'Pick a topic',
      i18n: { required: 'errors.topic' },
    });
    expect(fields(toDefinition(form))[3].validation).toEqual({ required: true });
  });
});

describe('translated identifiers', () => {
  const plain = {
    id: 'f',
    title: 'F',
    submit: { label: 'Send' },
    steps: [
      {
        id: 'step-1',
        title: 'Step 1',
        i18n: { title: 'f.start' },
        fields: [
          {
            key: 'size',
            type: 'radio',
            label: 'Size',
            i18n: { label: 'f.size' },
            options: [
              { value: 'small', label: 'Small', i18n: { label: 'f.small' } },
              { value: 'large', label: 'Large' },
            ],
          },
        ],
      },
    ],
  } as FormDefinition;

  it('keeps keys, values and step ids that carry translation keys when labels change', () => {
    const form = fromDefinition(plain);
    const size = form.blocks.find(isQuestion)!;
    setOptionLabel(form, size.uid, size.options[0].uid, 'Tiny');
    setOptionLabel(form, size.uid, size.options[1].uid, 'Huge');
    const [step] = toDefinition(form).steps!;
    expect(step.id).toBe('step-1');
    expect(step.fields[0].key).toBe('size');
    expect(step.fields[0].options!.map((option) => option.value)).toEqual(['small', 'huge']);
  });

  it('keeps every identifier of a form with a language or translation keys', () => {
    const form = fromDefinition({ ...plain, lang: 'en' });
    const size = form.blocks.find(isQuestion)!;
    setOptionLabel(form, size.uid, size.options[1].uid, 'Huge');
    expect(toDefinition(form).steps![0].fields[0].options!.map((option) => option.value)).toEqual(['small', 'large']);
  });
});

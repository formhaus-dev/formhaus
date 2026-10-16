import { describe, expect, it } from 'vitest';
import { addField, addTrackingFields, createForm, setFieldType, toDefinition } from '../src';

describe('tracking fields', () => {
  it('adds hidden UTM and referrer fields after the placement', () => {
    const form = createForm('signup', 'Signup');
    const name = addField(form, { step: null }, { label: 'Name' });
    addField(form, { step: null }, { label: 'Email', type: 'email' });
    expect(addTrackingFields(form, { after: name.uid })).toHaveLength(6);
    const fields = toDefinition(form).fields!;
    expect(fields.map((field) => field.key)).toEqual([
      'name',
      'utm_source',
      'utm_medium',
      'utm_campaign',
      'utm_term',
      'utm_content',
      'referrer',
      'email',
    ]);
    expect(fields[1]).toEqual({ key: 'utm_source', type: 'hidden', label: 'UTM source', source: { query: 'utm_source' } });
    expect(fields[6]).toEqual({ key: 'referrer', type: 'hidden', label: 'Referrer', source: 'referrer' });
  });

  it('skips keys and sources that the form already has', () => {
    const form = createForm('signup', 'Signup');
    addField(form, { step: null }, { label: 'Source', type: 'hidden', key: 'utm_source' });
    addField(form, { step: null }, { label: 'Came from', type: 'hidden', key: 'came_from', extra: { source: 'referrer' } });
    addTrackingFields(form, { step: null });
    expect(toDefinition(form).fields!.map((field) => field.key)).toEqual([
      'utm_source',
      'came_from',
      'utm_medium',
      'utm_campaign',
      'utm_term',
      'utm_content',
    ]);
    expect(addTrackingFields(form, { step: null })).toEqual([]);
  });

  it('adds the fields after a group instead of inside it', () => {
    const form = createForm('signup', 'Signup');
    const people = addField(form, { step: null }, { label: 'People', type: 'group' });
    const name = addField(form, { inside: people.uid }, { label: 'Name' });
    addTrackingFields(form, { after: name.uid });
    addTrackingFields(form, { inside: people.uid });
    const fields = toDefinition(form).fields!;
    expect(fields.map((field) => field.key)).toEqual([
      'people',
      'utm_source',
      'utm_medium',
      'utm_campaign',
      'utm_term',
      'utm_content',
      'referrer',
    ]);
    expect(fields[0].fields!.map((field) => field.key)).toEqual(['question', 'name']);
  });

  it('drops the source when a hidden field becomes another type', () => {
    const form = createForm('signup', 'Signup');
    const field = addField(form, { step: null }, { label: 'Ref', type: 'hidden', extra: { source: { query: 'ref' } } });
    setFieldType(form, field.uid, 'text');
    expect(toDefinition(form).fields![0]).not.toHaveProperty('source');
  });
});

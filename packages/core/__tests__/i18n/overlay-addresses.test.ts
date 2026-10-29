import { describe, expect, it } from 'vitest';
import type { FormDefinition, FormGroup } from '../../src';
import { localize, translationIssues } from '../../src/i18n';

const definition: FormDefinition = {
  id: 'trip',
  title: 'Trip',
  submit: { label: 'Book' },
  steps: [
    {
      id: 'who',
      title: 'Who',
      fields: [
        { key: 'name', type: 'text', label: 'Name', validation: { required: 'Enter a name' } },
        { key: 'city', type: 'select', label: 'City', options: [{ value: 'rome', label: 'Rome' }] },
      ],
    },
    {
      id: 'guests',
      title: 'Guests',
      fields: [{ key: 'people', type: 'group', label: 'Guests', fields: [{ key: 'age', type: 'number', label: 'Age' }] }],
    },
  ],
};

const overlay = {
  fields: {
    name: { label: 'Nom', validation: { required: 'Saisissez un nom' } },
    city: { label: 'Ville', options: { rome: 'Rome (Italie)' } },
    people: { label: 'Invités', fields: { age: { label: 'Âge' } } },
  },
  steps: { who: { fields: { city: { label: 'Destination' } } } },
};

describe('top-level field addresses in a multi-step overlay', () => {
  it('applies fields.<key> and lets steps.<id>.fields.<key> win', () => {
    const [who, guests] = localize(definition, { ...overlay, locale: 'ru' }).definition.steps!;
    expect(who.fields[0]).toMatchObject({ label: 'Nom', validation: { required: 'Saisissez un nom' } });
    expect(who.fields[1]).toMatchObject({ label: 'Destination', options: [{ value: 'rome', label: 'Rome (Italie)' }] });
    const group = guests.fields[0] as FormGroup;
    expect(group.label).toBe('Invités');
    expect(group.fields[0].label).toBe('Âge');
  });

  it('reports no unknown or missing texts for those addresses', () => {
    const issues = translationIssues(definition, overlay);
    expect(issues.unknown).toEqual([]);
    expect(issues.missing).not.toContain('steps.who.fields.name.label');
    expect(issues.missing).not.toContain('steps.guests.fields.people.fields.age.label');
    expect(translationIssues(definition, { fields: { ghost: { label: 'x' } } }).unknown).toEqual(['fields.ghost.label']);
  });
});

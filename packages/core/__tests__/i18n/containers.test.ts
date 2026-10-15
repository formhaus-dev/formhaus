import { describe, expect, it } from 'vitest';
import { checkTranslations, localize, textSlots, translationIssues, translationTemplate } from '../../src/i18n';
import type { FormDefinition } from '../../src/types';

const definition: FormDefinition = {
  formatVersion: '1.1',
  id: 'event',
  title: 'Event',
  submit: { label: 'Send' },
  steps: [
    {
      id: 'who',
      title: 'Who',
      fields: [
        {
          key: 'billing',
          type: 'section',
          title: 'Billing',
          description: 'Where invoices go',
          i18n: { title: 'billing.title' },
          fields: [{ key: 'street', type: 'text', label: 'Street' }],
        },
        {
          key: 'people',
          type: 'group',
          label: 'People',
          itemLabel: 'Person {index}',
          addLabel: 'Add person',
          removeLabel: 'Remove',
          validation: { required: 'Add someone', maxLength: 3 },
          fields: [
            { key: 'diet', type: 'select', label: 'Diet', options: [{ value: 'none', label: 'None' }], validation: { required: true } },
          ],
        },
      ],
    },
  ],
};

describe('translations of sections and groups', () => {
  it('addresses sections by key and item fields under their group', () => {
    const addresses = textSlots(definition).map((slot) => slot.address);
    expect(addresses).toEqual(
      expect.arrayContaining([
        'steps.who.sections.billing.title',
        'steps.who.sections.billing.description',
        'steps.who.fields.street.label',
        'steps.who.fields.people.label',
        'steps.who.fields.people.itemLabel',
        'steps.who.fields.people.addLabel',
        'steps.who.fields.people.removeLabel',
        'steps.who.fields.people.validation.required',
        'steps.who.fields.people.fields.diet.label',
        'steps.who.fields.people.fields.diet.options.none',
        'messages.maxItems',
        'labels.addItem',
        'labels.removeItem',
        'labels.itemLabel',
        'labels.itemAdded',
        'labels.itemRemoved',
      ]),
    );
    expect(textSlots(definition).find((slot) => slot.address === 'steps.who.sections.billing.title')?.key).toBe('billing.title');
  });

  it('applies an overlay to sections, groups and item fields', () => {
    const overlay = translationTemplate(definition);
    expect(overlay.steps).toMatchObject({
      who: { sections: { billing: { title: 'Billing' } }, fields: { people: { fields: { diet: { label: 'Diet' } } } } },
    });
    const localized = localize(definition, {
      overlay: {
        steps: {
          who: {
            sections: { billing: { title: 'Facturation' } },
            fields: { people: { itemLabel: 'Personne {index}', fields: { diet: { label: 'Régime', options: { none: 'Aucun' } } } } },
          },
        },
      },
    }).definition;
    const [section, group] = localized.steps![0].fields as [
      { title: string },
      { itemLabel: string; fields: { label: string; options: { label: string }[] }[] },
    ];
    expect(section.title).toBe('Facturation');
    expect(group.itemLabel).toBe('Personne {index}');
    expect(group.fields[0].label).toBe('Régime');
    expect(group.fields[0].options[0].label).toBe('Aucun');
  });

  it('checks the {index} placeholder', () => {
    const overlay = { steps: { who: { fields: { people: { itemLabel: 'Personne' } } } } };
    expect(translationIssues(definition, overlay).placeholderMismatch).toEqual(['steps.who.fields.people.itemLabel']);
    expect(translationIssues(definition, { labels: { itemLabel: '{label}' } }).placeholderMismatch).toEqual(['labels.itemLabel']);
  });

  it('checks translation keys of sections and groups', () => {
    const broken = structuredClone(definition);
    const [section, group] = broken.steps![0].fields as [Record<string, unknown>, Record<string, unknown>];
    section.i18n = { label: 'x' };
    group.i18n = { placeholder: 'y', addLabel: 'people.add' };
    expect(checkTranslations(broken).map(({ code, path }) => `${code} ${path}`)).toEqual([
      'unknown-i18n-slot /steps/0/fields/1/i18n/placeholder',
      'unknown-i18n-slot /steps/0/fields/0/i18n/label',
    ]);
  });
});

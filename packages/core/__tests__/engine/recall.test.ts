import { describe, expect, it } from 'vitest';
import { FormEngine, recallStatic, recallText, type FormDefinition, type FormGroup } from '../../src';
import { itemTitle } from '../../src/internal';
import { asStored } from '../../src/engine/recall-format';

const definition = (formatVersion = '1.5'): FormDefinition => ({
  formatVersion,
  id: 'f',
  title: 'F',
  submit: { label: 'Send' },
  fields: [
    { key: 'name', type: 'text', label: 'Name' },
    {
      key: 'plan',
      type: 'radio',
      label: 'Plan',
      options: [
        { value: 'pro', label: 'Pro' },
        { value: 'team', label: 'Team' },
      ],
    },
    {
      key: 'tags',
      type: 'multiselect',
      label: 'Tags',
      options: [
        { value: 'a', label: 'Alpha' },
        { value: 'b', label: 'Beta' },
      ],
    },
    { key: 'agree', type: 'checkbox', label: 'I agree' },
    { key: 'seats', type: 'number', label: 'Seats' },
    { key: 'day', type: 'date', label: 'Day' },
    { key: 'cv', type: 'file', label: 'CV' },
    { key: 'ref', type: 'hidden' },
    { key: 'pw', type: 'password', label: 'Password' },
    { key: 'note', type: 'text', label: 'Note', show: [{ field: 'plan', eq: 'team' }] },
    { key: 'people', type: 'group', label: 'People', fields: [{ key: 'first', type: 'text', label: 'First' }] },
  ],
});

const recall = (text: string, values: Record<string, unknown>, item?: { group: string; index: number }, version?: string) =>
  recallText(definition(version), text, values, { item, format: asStored });

describe('recallText', () => {
  it('shows each value kind', () => {
    const values = {
      name: 'Ada',
      plan: 'pro',
      tags: ['a', 'b'],
      agree: true,
      seats: 3,
      day: '2026-01-02',
      cv: [{ name: 'cv.pdf' }, { name: 'photo.png' }],
      people: [{ first: 'Bo' }, {}],
    };
    expect(recall('{{name}}|{{ plan }}|{{tags}}|{{agree}}|{{seats}}|{{day}}|{{cv}}|{{people}}', values)).toBe(
      'Ada|Pro|Alpha, Beta|I agree|3|2026-01-02|cv.pdf, photo.png|2',
    );
  });

  it('shows empty text for false, missing and unknown values', () => {
    expect(recall('[{{agree}}][{{name}}][{{nope}}][{{tags}}]', { agree: false, tags: [] })).toBe('[][][][]');
  });

  it('shows a hidden field value', () => {
    expect(recall('{{ref}}', { ref: 42 })).toBe('42');
  });

  it('keeps an option value without a matching option', () => {
    expect(recall('{{plan}}', { plan: 'gold' })).toBe('gold');
  });

  it('reads item fields inside a group item', () => {
    const values = { name: 'Ada', people: [{ first: 'Bo' }, { first: 'Cy' }] };
    expect(recall('{{first}} {{name}}', values, { group: 'people', index: 1 })).toBe('Cy Ada');
    expect(recall('[{{first}}]', values)).toBe('[]');
    expect(recall('[{{first}}]', values, { group: 'people', index: 2 })).toBe('[]');
    expect(recall('{{plan}}', { ...values, plan: 'team' }, { group: 'people', index: 0 })).toBe('Team');
  });

  it('does not expand a recalled value again', () => {
    expect(recall('{{name}}', { name: '{{plan}}', plan: 'pro' })).toBe('{{plan}}');
  });

  it('cuts the resolved text at the string limit', () => {
    expect(recall('{{name}}', { name: 'x'.repeat(10001) })).toHaveLength(10000);
    expect(recall('{{name}}'.repeat(2000), { name: 'x'.repeat(10000) })).toHaveLength(10000);
    expect(recall('ab{{name}}cd', { name: 'x'.repeat(10000) })).toBe(`ab${'x'.repeat(9998)}`);
    expect(recall('a{{name}}', { name: '\u{1F600}'.repeat(5000) })).toBe(`a${'\u{1F600}'.repeat(4999)}`);
  });

  it('shows nothing for a password field', () => {
    expect(recall('[{{pw}}]', { pw: 'hunter2' })).toBe('[]');
  });

  it('keeps the text below format 1.5', () => {
    expect(recall('Hi {{name}}', { name: 'Ada' }, undefined, '1.4')).toBe('Hi {{name}}');
  });

  it('leaves single braces and malformed tokens alone', () => {
    expect(recall('{name} {{ }} {{a b}}', { name: 'Ada' })).toBe('{name} {{ }} {{a b}}');
  });

  it('keeps tokens with reserved content as written', () => {
    const text = '{{name|upper}} {{name?}} {{a:b}} {{f(name)}} {{\'name\'}} {{"name"}} {{name[0]}} {{na me}} {{name}}';
    expect(recall(text, { name: 'Ada' })).toBe(text.replace(/\{\{name\}\}$/, 'Ada'));
  });

  it('accepts letters, digits, underscores, dashes and dots in keys', () => {
    const fields = [
      { key: 'имя_1-a', type: 'text', label: 'Имя' },
      { key: 'contact.email', type: 'email', label: 'Email' },
    ];
    const values = { 'имя_1-a': 'Ада', 'contact.email': 'a@b.co' };
    expect(recallText({ ...definition(), fields }, 'Hi {{ имя_1-a }} {{contact.email}}', values)).toBe('Hi Ада a@b.co');
  });

  it('shows literal braces for an escaped token', () => {
    expect(recall('\\{{name}} is {{name}}, \\{{ alone', { name: 'Ada' })).toBe('{{name}} is Ada, {{ alone');
    expect(recall('\\{{name}}', { name: 'Ada' }, undefined, '1.4')).toBe('\\{{name}}');
  });

  it('resolves the item label inside the item', () => {
    const values = { people: [{ first: 'Bo' }] };
    expect(recall('Person {{first}}', values, { group: 'people', index: 0 })).toBe('Person Bo');
  });

  it('reads the values a field hidden by a condition no longer holds', () => {
    const engine = new FormEngine(definition(), { plan: 'pro', note: 'kept' });
    expect(recallText(engine.definition, '[{{note}}]', engine.getSubmitValues())).toBe('[]');
    engine.setValue('plan', 'team');
    engine.setValue('note', 'shown');
    expect(recallText(engine.definition, '[{{note}}]', engine.getSubmitValues())).toBe('[shown]');
  });
});

describe('item titles', () => {
  const title = (itemLabel: string, kid: string) => {
    const fields = [{ key: 'kids', type: 'group', label: 'Kids', itemLabel, fields: [{ key: 'kid', type: 'text', label: 'Kid' }] }];
    const engine = new FormEngine({ ...definition(), fields } as FormDefinition, { kids: [{ kid }] });
    return itemTitle(engine, engine.definition.fields![0] as FormGroup, 0);
  };

  it('fills parameters and tokens in one pass', () => {
    expect(title('{{kid}}', '{index} {{index}} {label}')).toBe('{index} {{index}} {label}');
    expect(title('{label} {index}: {{kid}} \\{{index}} {other}', 'Bo')).toBe('Kids 1: Bo {{index}} {other}');
  });

  it('reads the group label outside the item', () => {
    const fields = [
      { key: 'name', type: 'text', label: 'Name' },
      {
        key: 'guests',
        type: 'group',
        label: 'Guests of {{name}} [{{guest}}]',
        itemLabel: '{label} {index}: {{guest}}',
        fields: [{ key: 'guest', type: 'text', label: 'Guest' }],
      },
    ];
    const engine = new FormEngine({ ...definition(), fields } as FormDefinition, { name: 'Ada', guests: [{ guest: 'Bo' }] });
    expect(itemTitle(engine, engine.definition.fields![1] as FormGroup, 0)).toBe('Guests of Ada [] 1: Bo');
  });

  it('cuts default, catalog and function item titles at the string limit', () => {
    const fields = [
      { key: 'name', type: 'text', label: 'Name' },
      { key: 'kids', type: 'group', label: '{{name}}', fields: [{ key: 'kid', type: 'text', label: 'Kid' }] },
    ];
    const engine = new FormEngine({ ...definition(), fields } as FormDefinition, { name: 'x'.repeat(10000), kids: [{}] });
    const group = engine.definition.fields![1] as FormGroup;
    expect(itemTitle(engine, group, 0)).toBe('x'.repeat(10000));
    expect(itemTitle(engine, group, 0, { itemLabel: '{label}'.repeat(1000) })).toBe('x'.repeat(10000));
    expect(itemTitle(engine, group, 0, () => 'y'.repeat(20000))).toHaveLength(10000);
  });

  it('fills parameters below format 1.5', () => {
    const fields = [{ key: 'kids', type: 'group', label: 'Kids', itemLabel: '{label} #{index} {{kid}}', fields: [] }];
    const engine = new FormEngine({ ...definition('1.4'), fields } as FormDefinition, { kids: [{}] });
    expect(itemTitle(engine, engine.definition.fields![0] as FormGroup, 0)).toBe('Kids #1 {{kid}}');
  });
});

describe('recallStatic', () => {
  it('reads item keys from the given group only', () => {
    const fields = [
      { key: 'kids', type: 'group', label: 'Kids', fields: [{ key: 'name', type: 'text', label: 'Kid name' }] },
      { key: 'pets', type: 'group', label: 'Pets', fields: [{ key: 'name', type: 'text', label: 'Pet name' }] },
      { key: 'city', type: 'text', label: 'City' },
    ];
    const form = { ...definition(), fields } as FormDefinition;
    expect(recallStatic(form, '{{name}} in {{city}}', 'pets')).toBe('Pet name in City');
    expect(recallStatic(form, '{{name}} in {{city}}', 'kids')).toBe('Kid name in City');
    expect(recallStatic(form, '[{{name}}] in {{city}}')).toBe('[] in City');
  });

  it('names the source field of each token', () => {
    expect(recallStatic(definition(), 'Hi {{name}}, {{ plan }}, {{first}}, {{ref}}, [{{nope}}], {{a|b}}, \\{{name}}', 'people')).toBe(
      'Hi Name, Plan, First, ref, [], {{a|b}}, {{name}}',
    );
    expect(recallStatic(definition('1.4'), 'Hi {{name}}')).toBe('Hi {{name}}');
  });
});

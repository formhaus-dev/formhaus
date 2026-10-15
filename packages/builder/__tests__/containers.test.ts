import { checkDefinition, type FormDefinition } from '@formhaus/core';
import { describe, expect, it } from 'vitest';
import {
  addField,
  childrenOf,
  duplicateField,
  fromDefinition,
  moveField,
  moveFieldTo,
  removeField,
  toDefinition,
  type BuilderForm,
} from '../src';

const definition: FormDefinition = {
  formatVersion: '1.1',
  id: 'event',
  title: 'Event',
  submit: { label: 'Register' },
  steps: [
    {
      id: 'who',
      title: 'Who',
      fields: [
        { key: 'company', type: 'text', label: 'Company' },
        {
          key: 'billing',
          type: 'section',
          title: 'Billing',
          description: 'Invoices',
          fields: [
            { key: 'street', type: 'text', label: 'Street' },
            {
              key: 'people',
              type: 'group',
              label: 'People',
              itemLabel: 'Person {index}',
              validation: { required: true, maxLength: 3 },
              fields: [{ key: 'name', type: 'text', label: 'Name', validation: { required: true } }],
            },
          ],
        },
        { key: 'note', type: 'text', label: 'Note' },
      ],
    },
    { id: 'end', title: 'End', fields: [{ key: 'done', type: 'checkbox', label: 'Done' }] },
  ],
};

const keys = (form: BuilderForm) =>
  form.blocks.map((block) =>
    block.kind === 'page'
      ? `#${block.id}`
      : `${block.key}${block.parent ? `<${form.blocks.find((item) => item.uid === block.parent && item.kind === 'question')?.key ?? '?'}` : ''}`,
  );
const uidOf = (form: BuilderForm, key: string) => form.blocks.find((block) => block.kind === 'question' && block.key === key)!.uid;

describe('sections and groups in the builder', () => {
  it('round-trips nested containers', () => {
    const form = fromDefinition(definition);
    expect(keys(form)).toEqual(['#who', 'company', 'billing', 'street<billing', 'people<billing', 'name<people', 'note', '#end', 'done']);
    expect(toDefinition(form)).toEqual(definition);
  });

  it('adds a field inside a container and after its last child', () => {
    const form = fromDefinition(definition);
    addField(form, { inside: uidOf(form, 'people') }, { label: 'Email', type: 'email' });
    addField(form, { after: uidOf(form, 'street') }, { label: 'City' });
    addField(form, { after: uidOf(form, 'billing') }, { label: 'Later' });
    expect(keys(form)).toEqual([
      '#who',
      'company',
      'billing',
      'street<billing',
      'city<billing',
      'people<billing',
      'name<people',
      'email<people',
      'later',
      'note',
      '#end',
      'done',
    ]);
    expect(checkDefinition(toDefinition(form)).filter((issue) => issue.severity === 'error')).toEqual([]);
  });

  it('starts a new container with one field and keeps sections out of containers', () => {
    const form = fromDefinition(definition);
    const group = addField(form, { after: uidOf(form, 'company') }, { type: 'group', label: 'Guests' });
    expect(childrenOf(form, group.uid)).toHaveLength(1);
    const section = addField(form, { inside: uidOf(form, 'billing') }, { type: 'section', label: 'Inner' });
    expect(section.parent).toBeUndefined();
    const nested = addField(form, { inside: uidOf(form, 'people') }, { type: 'group', label: 'Nested' });
    expect(nested.parent).toBe(uidOf(form, 'billing'));
  });

  it('moves children within their container and containers with their children', () => {
    const form = fromDefinition(definition);
    expect(moveField(form, uidOf(form, 'street'), -1)).toBe(false);
    expect(moveField(form, uidOf(form, 'street'), 1)).toBe(true);
    expect(moveField(form, uidOf(form, 'street'), 1)).toBe(false);
    expect(moveField(form, uidOf(form, 'billing'), -1)).toBe(true);
    expect(keys(form)).toEqual(['#who', 'billing', 'people<billing', 'name<people', 'street<billing', 'company', 'note', '#end', 'done']);
    expect(moveField(form, uidOf(form, 'note'), -1)).toBe(true);
    expect(keys(form).slice(0, 7)).toEqual(['#who', 'billing', 'people<billing', 'name<people', 'street<billing', 'note', 'company']);
    expect(moveField(form, uidOf(form, 'company'), 1)).toBe(true);
    expect(keys(form).slice(6, 9)).toEqual(['#end', 'company', 'done']);
  });

  it('reorders children by drag index and detaches a child moved to another step', () => {
    const form = fromDefinition(definition);
    const step = form.blocks[0].uid;
    moveFieldTo(form, uidOf(form, 'street'), step, 1);
    expect(keys(form).slice(2, 6)).toEqual(['billing', 'people<billing', 'name<people', 'street<billing']);
    moveFieldTo(form, uidOf(form, 'street'), form.blocks[7].uid, 9);
    expect(keys(form).at(-1)).toBe('street');
  });

  it('removes and duplicates containers with their children', () => {
    const form = fromDefinition(definition);
    const copy = duplicateField(form, uidOf(form, 'people'))!;
    expect(childrenOf(form, copy.uid).map((child) => child.key)).toEqual(['name2']);
    expect(copy.parent).toBe(uidOf(form, 'billing'));
    expect(removeField(form, uidOf(form, 'name'))).toBe(false);
    expect(removeField(form, uidOf(form, 'billing'))).toBe(true);
    expect(keys(form)).toEqual(['#who', 'company', 'note', '#end', 'done']);
  });
});

describe('nested container edge cases', () => {
  it('keeps every block inside the right container', () => {
    const form = fromDefinition(definition);
    addField(form, { inside: uidOf(form, 'people') }, { type: 'group', label: 'Guests' });
    expect(keys(form).slice(2, 8)).toEqual([
      'billing',
      'street<billing',
      'people<billing',
      'name<people',
      'guests<billing',
      'question<guests',
    ]);
    addField(form, { after: uidOf(form, 'name') }, { type: 'section', label: 'Later' });
    expect(keys(form)[8]).toBe('later');
    expect(moveField(form, uidOf(form, 'note'), -1)).toBe(true);
    expect(keys(form).indexOf('note')).toBe(keys(form).indexOf('later') - 1);
    expect(removeField(form, uidOf(form, 'billing'))).toBe(true);
    expect(keys(form).filter((key) => key.includes('<undefined') || key.includes('<?'))).toEqual([]);
  });
});

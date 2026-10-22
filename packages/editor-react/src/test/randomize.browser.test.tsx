import { fromDefinition, toDefinition } from '@formhaus/builder';
import type { FormDefinition, FormField, FormNode } from '@formhaus/core';
import { cleanup, screen, waitFor, within } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { page, userEvent } from 'vitest/browser';
import { renderEditor } from './harness';

type Store = ReturnType<typeof renderEditor>['store'];

const options = [
  { value: 'email', label: 'Email' },
  { value: 'phone', label: 'Phone' },
  { value: 'other', label: 'Other' },
];
const definition = (fields: FormNode[]): FormDefinition => ({ id: 'survey', title: 'Survey', submit: { label: 'Send' }, fields });
const first = (store: Store) => (toDefinition(store.getState().form).fields ?? [])[0] as FormField;

async function settings(label: string) {
  const card = screen.getByRole('group', { name: `${label} field` });
  await userEvent.click(within(card).getByRole('button', { name: 'Field settings' }));
  return within(within(card).getByRole('group', { name: 'Field settings' }));
}

describe('randomized options', () => {
  beforeEach(async () => {
    await page.viewport(1440, 1000);
  });

  afterEach(() => {
    cleanup();
  });

  it('pins options only while randomize is on', async () => {
    const { store } = renderEditor(fromDefinition(definition([{ key: 'contact', type: 'radio', label: 'Contact', options }])));
    const panel = await settings('Contact');
    expect(screen.queryByRole('button', { name: 'Pin “Other” in place' })).toBeNull();
    await userEvent.click(panel.getByRole('switch', { name: 'Randomize option order' }));
    await waitFor(() => {
      expect(first(store).randomize).toBe(true);
    });
    expect(panel.getByRole('switch', { name: 'Randomize option order' })).toHaveAccessibleDescription('Pin to keep in place');
    await userEvent.click(screen.getByRole('button', { name: 'Pin “Other” in place' }));
    await waitFor(() => {
      expect(first(store).options?.[2]).toEqual({ value: 'other', label: 'Other', pinned: true });
    });
    expect(screen.getByRole('button', { name: 'Unpin “Other”' })).toBeVisible();
    await userEvent.click(panel.getByRole('switch', { name: 'Randomize option order' }));
    await waitFor(() => {
      expect(first(store)).not.toHaveProperty('randomize');
    });
    expect(first(store).options).toEqual(options);
    expect(panel.queryByText('Pin to keep in place')).toBeNull();
    expect(screen.queryByRole('button', { name: 'Unpin “Other”' })).toBeNull();
  });

  it('raises the format version with randomize in one undo step', async () => {
    const { store } = renderEditor(
      fromDefinition({ ...definition([{ key: 'contact', type: 'radio', label: 'Contact', options }]), formatVersion: '1.3' }),
    );
    const panel = await settings('Contact');
    await userEvent.click(panel.getByRole('switch', { name: 'Randomize option order' }));
    await waitFor(() => {
      expect(toDefinition(store.getState().form)).toMatchObject({ formatVersion: '1.6', fields: [{ randomize: true }] });
    });
    await userEvent.keyboard('{ControlOrMeta>}z{/ControlOrMeta}');
    await waitFor(() => {
      expect(toDefinition(store.getState().form).formatVersion).toBe('1.3');
    });
    expect(first(store)).not.toHaveProperty('randomize');
  });

  it('shows a ghost pin on an exclusive option', async () => {
    renderEditor(
      fromDefinition(
        definition([
          {
            key: 'channels',
            type: 'multiselect',
            label: 'Channels',
            randomize: true,
            options: [...options, { value: 'none', label: 'None of the above', exclusive: true }],
          },
        ]),
      ),
    );
    await settings('Channels');
    expect(screen.getByRole('button', { name: 'Pin “Other” in place' })).toBeVisible();
    expect(screen.queryByRole('button', { name: 'Pin “None of the above” in place' })).toBeNull();
    expect(screen.getByRole('button', { name: 'Never shuffled' })).toHaveAttribute('aria-disabled', 'true');
  });

  it('offers randomize on a select', async () => {
    renderEditor(fromDefinition(definition([{ key: 'country', type: 'select', label: 'Country', options }])));
    const panel = await settings('Country');
    expect(panel.getByRole('switch', { name: 'Randomize option order' })).not.toBeChecked();
  });

  it('hides randomize on matrix rows and text fields', async () => {
    renderEditor(
      fromDefinition(
        definition([
          {
            key: 'rate',
            type: 'section',
            title: 'Rate',
            layout: 'matrix',
            fields: [{ key: 'speed', type: 'radio', label: 'Speed', options }],
          },
          { key: 'name', type: 'text', label: 'Name' },
        ]),
      ),
    );
    const row = await settings('Speed');
    expect(row.queryByRole('switch', { name: 'Randomize option order' })).toBeNull();
    const text = await settings('Name');
    expect(text.queryByRole('switch', { name: 'Randomize option order' })).toBeNull();
  });
});

import { fromDefinition, toDefinition } from '@formhaus/builder';
import type { FormDefinition, FormGroup } from '@formhaus/core';
import { cleanup, screen, waitFor, within } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { page, userEvent } from 'vitest/browser';
import { renderEditor } from './harness';

const definition: FormDefinition = {
  formatVersion: '1.1',
  id: 'event',
  title: 'Event',
  submit: { label: 'Register' },
  fields: [
    { key: 'company', type: 'text', label: 'Company' },
    { key: 'people', type: 'group', label: 'People', fields: [{ key: 'name', type: 'text', label: 'Name' }] },
  ],
};

describe('sections and groups in the editor', () => {
  afterEach(() => {
    cleanup();
  });

  it('shows group fields nested under the group and adds a field inside it', async () => {
    await page.viewport(1440, 1000);
    const { store } = renderEditor(fromDefinition(definition));
    const nested = screen.getByRole('group', { name: 'Fields in People' });
    expect(within(nested).getByRole('group', { name: 'Name field' })).toBeDefined();
    await userEvent.click(within(nested).getByRole('button', { name: 'Add field to People' }));
    await userEvent.click(within(await screen.findByRole('listbox')).getByRole('option', { name: /Email/ }));
    await waitFor(() => {
      const group = toDefinition(store.getState().form).fields?.[1] as FormGroup;
      expect(group.fields.map((field) => field.key)).toEqual(['name', 'email']);
    });
  });

  it('adds a section with a first field from the field palette', async () => {
    await page.viewport(1440, 1000);
    const { store } = renderEditor(fromDefinition(definition));
    const add = screen.getAllByRole('button', { name: 'Add field' }).at(-1)!;
    await userEvent.click(add);
    await userEvent.click(within(await screen.findByRole('listbox')).getByRole('option', { name: /Section/ }));
    await waitFor(() => {
      const section = toDefinition(store.getState().form).fields?.[2] as unknown as { type: string; fields: unknown[] };
      expect(section.type).toBe('section');
      expect(section.fields).toHaveLength(1);
    });
  });
});

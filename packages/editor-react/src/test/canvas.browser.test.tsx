import { toDefinition } from '@formhaus/builder';
import { cleanup, screen, waitFor, within } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { page, userEvent } from 'vitest/browser';
import { fieldLabel, labels, renderEditor } from './harness';

const pause = () => new Promise((resolve) => setTimeout(resolve, 150));

describe('editor canvas in a browser', () => {
  afterEach(() => {
    cleanup();
  });

  it('adds fields with Enter, edits labels and removes an empty one with Backspace', async () => {
    await page.viewport(1440, 1000);
    const { store } = renderEditor();
    await userEvent.click(fieldLabel(0));
    await userEvent.keyboard('Name{Enter}Work email{Enter}');
    await waitFor(() => {
      expect(labels()).toEqual(['Name', 'Work email', '']);
    });
    await userEvent.keyboard('{Backspace}');
    await waitFor(() => {
      expect(labels()).toEqual(['Name', 'Work email']);
    });
    expect(toDefinition(store.getState().form).fields?.map((field) => field.key)).toEqual(['name', 'workEmail']);
  });

  it('changes the type, edits options and marks a field required', async () => {
    await page.viewport(1440, 1000);
    const { store } = renderEditor();
    await userEvent.click(fieldLabel(0));
    await userEvent.keyboard('Plan');
    await userEvent.click(screen.getByRole('button', { name: /Field type: Short text/ }));
    await userEvent.click(within(await screen.findByRole('listbox')).getByRole('option', { name: /Multiple choice/ }));
    await userEvent.click(screen.getByRole('textbox', { name: 'Option 1' }));
    await userEvent.keyboard('Free{Enter}');
    await pause();
    await userEvent.keyboard('Pro');
    await userEvent.click(screen.getByRole('button', { name: 'Field settings' }));
    await userEvent.click(within(await screen.findByRole('group', { name: 'Field settings' })).getByRole('switch', { name: 'Required' }));
    const field = toDefinition(store.getState().form).fields?.[0];
    expect(field).toMatchObject({ key: 'plan', type: 'radio', validation: { required: true } });
    expect(field?.options?.map((option) => option.value)).toEqual(['free', 'pro', 'option-3']);
  });

  it('reorders with Alt+arrows and with a keyboard drag', async () => {
    await page.viewport(1440, 1000);
    renderEditor();
    await userEvent.click(fieldLabel(0));
    await userEvent.keyboard('A{Enter}B{Enter}C');
    await userEvent.keyboard('{Alt>}{ArrowUp}{/Alt}');
    await waitFor(() => {
      expect(labels()).toEqual(['A', 'C', 'B']);
    });
    screen.getByRole('button', { name: 'Reorder A' }).focus();
    await userEvent.keyboard('[Space]');
    await pause();
    await userEvent.keyboard('{ArrowDown}');
    await pause();
    await userEvent.keyboard('[Space]');
    await waitFor(() => {
      expect(labels()).toEqual(['C', 'A', 'B']);
    });
  });

  it('deletes a field and brings it back with Undo', async () => {
    await page.viewport(1440, 1000);
    renderEditor();
    await userEvent.click(fieldLabel(0));
    await userEvent.keyboard('Keep{Enter}Drop');
    await userEvent.click(within(screen.getByRole('group', { name: 'Drop field' })).getByRole('button', { name: 'Field actions' }));
    await userEvent.click(await screen.findByRole('menuitem', { name: /Delete field/ }));
    await waitFor(() => {
      expect(labels()).toEqual(['Keep']);
    });
    await waitFor(() => {
      expect(screen.getAllByRole('button', { name: 'Undo' }).length).toBe(2);
    });
    const toastUndo = screen.getAllByRole('button', { name: 'Undo' }).find((button) => !button.hasAttribute('aria-keyshortcuts'));
    if (!toastUndo) throw new Error('No undo in the toast');
    toastUndo.click();
    await waitFor(() => {
      expect(labels()).toEqual(['Keep', 'Drop']);
    });
  });

  it('adds a step and keeps fields in order across steps', async () => {
    await page.viewport(1440, 1000);
    const { store } = renderEditor();
    await userEvent.click(fieldLabel(0));
    await userEvent.keyboard('Email');
    await userEvent.click(screen.getByRole('button', { name: 'Add step' }));
    await userEvent.keyboard('Details');
    await waitFor(() => {
      expect(toDefinition(store.getState().form).steps?.map((step) => step.title)).toEqual(['Step 1', 'Details']);
    });
    expect(screen.getByRole('group', { name: 'Details, step 2 of 2' })).toBeVisible();
    const row = screen.getByRole('group', { name: 'Details, step 2 of 2' }).firstElementChild;
    expect(row && getComputedStyle(row).cursor).toBe('pointer');
    expect(getComputedStyle(screen.getAllByRole('button', { name: 'Add field' })[0] as Element).cursor).toBe('pointer');
  });

  it('offers every hosted field type in groups and adds a preset', async () => {
    await page.viewport(1440, 1000);
    const { store } = renderEditor();
    await userEvent.click(screen.getByRole('button', { name: 'Add field' }));
    for (const name of ['Text', 'Choice', 'Contact', 'Date & number', 'Other']) {
      expect(screen.getByRole('group', { name })).toBeVisible();
    }
    for (const name of [
      'Short text',
      'Long text',
      'Multiple choice',
      'Checkboxes',
      'Dropdown',
      'Email',
      'Phone',
      'Number',
      'Date',
      'Date and time',
      'Checkbox',
      'Switch',
    ]) {
      expect(within(screen.getByRole('listbox')).getByText(name, { exact: true })).toBeVisible();
    }
    await userEvent.click(screen.getByRole('option', { name: /^Email/ }));
    await waitFor(() => {
      expect(toDefinition(store.getState().form).fields?.[1]).toMatchObject({
        key: 'email',
        type: 'email',
        validation: { required: true },
      });
    });
  });

  it('is view only for viewers', async () => {
    await page.viewport(1440, 1000);
    const { store } = renderEditor(undefined, { readOnly: true });
    await userEvent.click(fieldLabel(0));
    await userEvent.keyboard('Hi');
    expect(screen.getByText('View only')).toBeVisible();
    expect(screen.queryByRole('button', { name: 'Field actions' })).toBeNull();
    expect(screen.queryByRole('button', { name: 'Add field' })).toBeNull();
    expect(store.getState().form.blocks[0]).toMatchObject({ label: '' });
  });
});

import { fromDefinition } from '@formhaus/builder';
import type { FormDefinition } from '@formhaus/core';
import { cleanup, screen, waitFor, within } from '@testing-library/react';
import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest';
import { page, userEvent } from 'vitest/browser';
import ReactPreview from '../preview/ReactPreview';
import { renderEditor } from './harness';

const form: FormDefinition = {
  id: 'fonts',
  title: 'Fonts',
  submit: { label: 'Send' },
  steps: [
    {
      id: 'one',
      title: 'One',
      fields: [
        { key: 'name', type: 'text', label: 'Name' },
        {
          key: 'rate',
          type: 'section',
          title: 'Rate',
          layout: 'matrix',
          fields: [
            {
              key: 'easy',
              type: 'radio',
              label: 'The editor is easy to use',
              options: [
                { value: 'yes', label: 'Yes' },
                { value: 'no', label: 'No' },
              ],
            },
          ],
        },
        { key: 'more', type: 'text', label: '' },
      ],
    },
    { id: 'two', title: 'Two', fields: [{ key: 'age', type: 'number', label: 'Age' }] },
  ],
} as FormDefinition;

const font = (node: Element) => getComputedStyle(node).fontFamily;
const root = () => document.querySelector('.fh-editor')!;

function expectEditorFont(node: Element) {
  expect(node.closest('[data-fh-ed-layer], .fh-editor')).not.toBeNull();
  expect(font(node)).toBe(font(root()));
  const text = [...node.querySelectorAll('span, p, label, [role="option"], [role="menuitem"]')].find((item) => item.textContent?.trim());
  if (text) expect(font(text)).toBe(font(root()));
}

const card = (name: string) => screen.getByRole('group', { name: `${name} field` });

describe('overlays inherit the editor font on a serif host page', () => {
  beforeAll(() => {
    document.body.style.fontFamily = 'Times, serif';
  });

  afterAll(() => {
    document.body.style.removeProperty('font-family');
  });

  afterEach(() => {
    cleanup();
  });

  it('keeps the editor root off the host font', async () => {
    await page.viewport(1280, 900);
    renderEditor(fromDefinition(form));
    expect(font(root())).not.toContain('Times');
  });

  it.each([
    [
      'tooltip',
      async () => {
        await userEvent.hover(within(card('Name')).getByRole('button', { name: 'Field settings' }));
        return screen.findByRole('tooltip');
      },
    ],
    [
      'field actions menu',
      async () => {
        await userEvent.click(within(card('Name')).getByRole('button', { name: 'Field actions' }));
        return screen.findByRole('menu');
      },
    ],
    [
      'matrix row type switcher',
      async () => {
        await userEvent.click(within(card('The editor is easy to use')).getByRole('button', { name: /^Field type/ }));
        return screen.findByRole('dialog', { name: 'Matrix rows are multiple choice or checkboxes' });
      },
    ],
    [
      'field picker',
      async () => {
        await userEvent.click(screen.getAllByRole('button', { name: 'Add field' }).at(-1)!);
        return screen.findByRole('listbox');
      },
    ],
    [
      'shortcuts dialog',
      async () => {
        await userEvent.click(within(card('Name')).getByRole('textbox', { name: 'Field label' }));
        await userEvent.keyboard('{Escape}?');
        return screen.findByRole('dialog', { name: 'Keyboard shortcuts' });
      },
    ],
    [
      'delete step dialog',
      async () => {
        await userEvent.click(screen.getAllByRole('button', { name: 'Step actions' })[1]!);
        await userEvent.click(await screen.findByRole('menuitem', { name: /Delete step/ }));
        return screen.findByRole('dialog', { name: 'Delete “Two”?' });
      },
    ],
    [
      'publish check',
      async () => {
        await userEvent.click(screen.getByRole('button', { name: 'Publish' }));
        return screen.findByRole('dialog', { name: /before publishing/ });
      },
    ],
    [
      'toast',
      async () => {
        await userEvent.click(within(card('Age')).getByRole('button', { name: 'Field actions' }));
        await userEvent.click(await screen.findByRole('menuitem', { name: /Delete/ }));
        await waitFor(() => {
          expect(screen.getAllByRole('button', { name: 'Undo' }).length).toBe(2);
        });
        return screen
          .getAllByRole('button', { name: 'Undo' })
          .find((button) => !button.hasAttribute('aria-keyshortcuts'))!
          .closest('li')!;
      },
    ],
    [
      'condition select',
      async () => {
        await userEvent.click(within(card('Age')).getByRole('button', { name: 'Field settings' }));
        return within(card('Age')).getByRole('combobox', { name: 'Show this field' });
      },
    ],
    [
      'preview',
      async () => {
        await userEvent.click(screen.getByRole('radio', { name: 'Preview' }));
        return screen.findByRole('region', { name: 'Preview' });
      },
    ],
  ] as const)('uses the editor font in the %s at 1280', async (_name, open) => {
    await page.viewport(1280, 900);
    renderEditor(fromDefinition(form), { host: { Preview: ReactPreview } });
    expectEditorFont(await open());
  });

  it('uses the editor font in the bottom sheet at 390', async () => {
    await page.viewport(390, 844);
    renderEditor(fromDefinition(form));
    await userEvent.click(within(card('The editor is easy to use')).getByRole('textbox', { name: 'Field label' }));
    await userEvent.click(within(card('The editor is easy to use')).getByRole('button', { name: /^Field type/ }));
    const sheet = await screen.findByRole('dialog', { name: 'Matrix rows are multiple choice or checkboxes' });
    await waitFor(() => {
      expect(sheet.closest('.fh-editor')).toBeNull();
    });
    expectEditorFont(sheet);
  });
});

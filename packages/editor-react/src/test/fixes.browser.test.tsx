import { EditorView } from '@codemirror/view';
import { toDefinition } from '@formhaus/builder';
import type { FormDefinition } from '@formhaus/core';
import { cleanup, render, screen, waitFor, within } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { page, userEvent } from 'vitest/browser';
import { JsonIssues } from '../json/JsonIssues';
import { TooltipProvider } from '../ui';
import { renderEditor } from './harness';

function view(): EditorView {
  const dom = document.querySelector<HTMLElement>('.cm-editor');
  const found = dom ? EditorView.findFromDOM(dom) : null;
  if (!found) throw new Error('No JSON editor');
  return found;
}

const jsonText = () => view().state.doc.toString();

function paste(value: unknown) {
  const editor = view();
  editor.dispatch({ changes: { from: 0, to: editor.state.doc.length, insert: JSON.stringify(value, null, 2) }, userEvent: 'input.paste' });
}

async function openJson() {
  await userEvent.click(screen.getByRole('radio', { name: 'JSON' }));
  await waitFor(() => {
    view();
  });
}

const issueList = () => screen.getByRole('list', { name: 'Definition issues' });

const broken = {
  id: 'contact',
  title: 'Contact',
  submit: { label: 'Send' },
  fields: [
    { key: 'email', type: 'email', label: 'Email' },
    { key: 'email', type: 'email', label: 'Work email' },
    { key: 'note', type: 'textarea', label: 'Note', show: [{ field: 'emaly', notEmpty: true }] },
  ],
};

const founder = {
  imd: 'contact',
  title: 'Contact us',
  submit: { label: 'Send' },
  fields: [
    { key: 'name', type: 'text', label: 'Name' },
    { key: 'email', type: 'email', label: '' },
    { key: 'email', type: 'email', label: 'Work email' },
  ],
};

describe('definition fixes in the JSON tab', () => {
  afterEach(() => {
    cleanup();
  });

  it('repairs a misspelled id, an empty label and a duplicate key with one click', async () => {
    await page.viewport(1440, 1000);
    const { store } = renderEditor();
    await openJson();
    paste(founder);
    await userEvent.click(await screen.findByRole('button', { name: 'Fix all safe issues (4)' }, { timeout: 5000 }));
    await waitFor(() => {
      expect(screen.queryByRole('list', { name: 'Definition issues' })).toBeNull();
    });
    expect(toDefinition(store.getState().form)).toMatchObject({
      id: 'contact',
      fields: [{ key: 'name' }, { key: 'email', label: 'Email' }, { key: 'email_2', label: 'Work email' }],
    });
    expect(jsonText()).not.toContain('imd');
    await userEvent.click(screen.getByRole('button', { name: 'Undo' }));
    await waitFor(() => {
      expect(jsonText()).toContain('"imd": "contact"');
    });
    expect(await screen.findByRole('button', { name: 'Fix all safe issues (4)' }, { timeout: 5000 })).toBeTruthy();
  });

  it('keeps the cursor where it was and selects nothing after Fix all', async () => {
    await page.viewport(1440, 1000);
    renderEditor();
    await openJson();
    paste(founder);
    const editor = view();
    editor.dispatch({ selection: { anchor: jsonText().indexOf('"Work email"') } });
    await userEvent.click(await screen.findByRole('button', { name: 'Fix all safe issues (4)' }, { timeout: 5000 }));
    await waitFor(() => {
      expect(jsonText()).toContain('"label": "Email"');
    });
    const { main } = view().state.selection;
    expect(main.empty).toBe(true);
    expect(main.anchor).toBe(jsonText().indexOf('"Work email"'));
  });

  it.each([
    ['Fix: Set the label to "Email"', 'Email'],
    ['Fix: Rename "imd" to "id"', 'id'],
    ['Fix: Rename the key to "email_2"', 'email_2'],
  ])('selects the value a fix wrote after %s', async (name, selected) => {
    await page.viewport(1440, 1000);
    renderEditor();
    await openJson();
    paste(founder);
    const buttons = await screen.findAllByRole('button', { name }, { timeout: 5000 });
    await userEvent.click(buttons[0] as HTMLElement);
    await waitFor(() => {
      const { main } = view().state.selection;
      expect(view().state.sliceDoc(main.from, main.to)).toBe(selected);
    });
    expect(view().hasFocus).toBe(true);
  });

  it('applies one fix to the JSON and the visual model as one undo step', async () => {
    await page.viewport(1440, 1000);
    const { store } = renderEditor();
    await openJson();
    paste(broken);
    const fix = await screen.findByRole('button', { name: 'Fix: Rename the key to "email_2"' }, { timeout: 5000 });
    await userEvent.click(fix);
    await waitFor(() => {
      expect(toDefinition(store.getState().form).fields?.map((field) => field.key)).toEqual(['email', 'email_2', 'note']);
    });
    expect(jsonText()).toContain('"key": "email_2"');
    await userEvent.click(screen.getByRole('button', { name: 'Undo' }));
    await waitFor(() => {
      expect(toDefinition(store.getState().form).fields?.map((field) => field.key)).toEqual(['email', 'email', 'note']);
    });
    expect(jsonText()).not.toContain('email_2');
  });

  it('fixes all safe issues at once and leaves unsafe fixes for review', async () => {
    await page.viewport(1440, 1000);
    const { store } = renderEditor();
    await openJson();
    paste(broken);
    await userEvent.click(await screen.findByRole('button', { name: 'Fix all safe issues (1)' }, { timeout: 5000 }));
    await waitFor(() => {
      expect(toDefinition(store.getState().form).fields?.map((field) => field.key)).toEqual(['email', 'email_2', 'note']);
    });
    await waitFor(() => {
      expect(screen.queryByRole('button', { name: /^Fix all safe issues/ })).toBeNull();
    });
    const unsafe = await within(issueList()).findByRole('button', { name: 'Fix: Use the field "email"' }, { timeout: 5000 });
    await userEvent.click(unsafe);
    await waitFor(() => {
      expect(screen.queryByRole('list', { name: 'Definition issues' })).toBeNull();
    });
    expect(toDefinition(store.getState().form).fields?.[2]?.show).toEqual([{ field: 'email', notEmpty: true }]);
  });
});

describe('an issue with several fixes', () => {
  afterEach(() => {
    cleanup();
  });

  it('offers them in a menu and applies the chosen one', async () => {
    const tools = await import('@formhaus/core/fix');
    let applied: unknown = null;
    const fixes = [
      { title: 'Use the field "email"', safe: false, patch: [{ op: 'replace' as const, path: '/fields/1/show/0/field', value: 'email' }] },
      { title: 'Use the field "name"', safe: false, patch: [{ op: 'replace' as const, path: '/fields/1/show/0/field', value: 'name' }] },
    ];
    const issue = { code: 'unknown-field' as const, severity: 'error' as const, path: '/fields/1/show/0/field', message: 'x', fixes };
    const definition = { id: 'f', fields: [{ key: 'name' }, { key: 'note', show: [{ field: 'nme' }] }] } as unknown as FormDefinition;
    render(
      <TooltipProvider>
        <JsonIssues
          issues={[issue]}
          tools={tools}
          onApply={(change) => {
            applied = change(definition);
            return true;
          }}
        />
      </TooltipProvider>,
    );
    await userEvent.click(screen.getByRole('button', { name: 'Fixes for /fields/1/show/0/field' }));
    await userEvent.click(await screen.findByRole('menuitem', { name: 'Use the field "name"' }));
    expect(applied).toMatchObject({ fields: [{ key: 'name' }, { show: [{ field: 'name' }] }] });
  });
});

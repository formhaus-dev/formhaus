import { EditorView } from '@codemirror/view';
import { fromDefinition, toDefinition } from '@formhaus/builder';
import type { FormDefinition } from '@formhaus/core';
import { cleanup, screen, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { page, userEvent } from 'vitest/browser';
import { loader } from '../store/initial';
import { fieldLabel, labels, renderEditor, topBar } from './harness';

const definition = (...names: string[]) =>
  JSON.stringify({
    id: 'contact',
    title: 'Contact',
    submit: { label: 'Send' },
    fields: names.map((name) => ({ key: name.toLowerCase(), type: 'text', label: name })),
  });

function view(): EditorView {
  const dom = document.querySelector<HTMLElement>('.cm-editor');
  const found = dom ? EditorView.findFromDOM(dom) : null;
  if (!found) throw new Error('No JSON editor');
  return found;
}

const jsonText = () => view().state.doc.toString();

function paste(text: string) {
  const editor = view();
  editor.dispatch({ changes: { from: 0, to: editor.state.doc.length, insert: text }, userEvent: 'input.paste' });
}

async function mode(name: 'Visual' | 'JSON') {
  await userEvent.click(screen.getByRole('radio', { name }));
  if (name === 'JSON') {
    await waitFor(() => {
      view();
    });
  }
}

describe('JSON mode in a browser', () => {
  afterEach(() => {
    cleanup();
  });

  it('shows visual edits in the JSON', async () => {
    await page.viewport(1440, 1000);
    renderEditor();
    await userEvent.click(fieldLabel(0));
    await userEvent.keyboard('Work email');
    await mode('JSON');
    expect(jsonText()).toContain('"label": "Work email"');
    await mode('Visual');
    await userEvent.click(fieldLabel(0));
    await userEvent.keyboard('{End} address');
    await mode('JSON');
    expect(jsonText()).toContain('"label": "Work email address"');
  });

  it('applies pasted JSON to the visual editor as one undo step', async () => {
    await page.viewport(1440, 1000);
    const { store } = renderEditor();
    await mode('JSON');
    paste(definition('Name', 'Company'));
    await waitFor(() => {
      expect(toDefinition(store.getState().form).fields?.map((field) => field.key)).toEqual(['name', 'company']);
    });
    await mode('Visual');
    expect(labels()).toEqual(['Name', 'Company']);
    await userEvent.click(screen.getByRole('button', { name: 'Undo' }));
    expect(labels()).toEqual(['']);
  });

  it('keeps the visual state and the typed text while the JSON is invalid', async () => {
    await page.viewport(1440, 1000);
    const { store } = renderEditor();
    await userEvent.click(fieldLabel(0));
    await userEvent.keyboard('Keep me');
    await mode('JSON');
    const broken = '{\n  "title": "Contact",\n  "fields": [\n}';
    paste(broken);
    await waitFor(() => {
      expect(screen.getByText(/^Line 4:/)).toBeInTheDocument();
    });
    expect(jsonText()).toBe(broken);
    expect((toDefinition(store.getState().form).fields?.[0] as { label?: string } | undefined)?.label).toBe('Keep me');
    await mode('Visual');
    expect(labels()).toEqual(['Keep me']);
  });

  it('undoes and redoes across Visual and JSON', async () => {
    await page.viewport(1440, 1000);
    const { store } = renderEditor();
    await userEvent.click(fieldLabel(0));
    await userEvent.keyboard('Visual');
    await mode('JSON');
    paste(definition('Pasted'));
    await waitFor(() => {
      expect((toDefinition(store.getState().form).fields?.[0] as { label?: string } | undefined)?.label).toBe('Pasted');
    });
    view().focus();
    const mod = /Mac/.test(navigator.platform) ? 'Meta' : 'Control';
    await userEvent.keyboard(`{${mod}>}z{/${mod}}`);
    await waitFor(() => {
      expect(jsonText()).toContain('"label": "Visual"');
    });
    await mode('Visual');
    expect(labels()).toEqual(['Visual']);
    await userEvent.click(screen.getByRole('button', { name: 'Redo' }));
    expect(labels()).toEqual(['Pasted']);
  });

  it('opens an existing form with its live version and keeps keys while editing', async () => {
    await page.viewport(1440, 1000);
    const live = JSON.parse(definition('Email')) as FormDefinition;
    const published = { definition: live, version: 3 };
    const { store } = renderEditor(loader(published)(live), { published });
    expect(screen.getByText('v3 · live')).toBeInTheDocument();
    await mode('JSON');
    expect(jsonText()).toContain('"key": "email"');
    paste(definition('Email', 'Company'));
    await waitFor(() => {
      expect(toDefinition(store.getState().form).fields?.map((field) => field.key)).toEqual(['email', 'company']);
    });
    await mode('Visual');
    await userEvent.click(fieldLabel(0));
    await userEvent.keyboard('{End} address');
    expect(toDefinition(store.getState().form).fields?.[0]).toMatchObject({ key: 'email', label: 'Email address' });
  });

  it('gives the JSON pane the full width of the editor toolbar', async () => {
    await page.viewport(1440, 1000);
    renderEditor();
    await mode('JSON');
    const bar = topBar().getBoundingClientRect();
    const pane = view().dom.closest<HTMLElement>('[class*="pane"]')?.getBoundingClientRect();
    expect(pane?.left).toBeCloseTo(bar.left, 0);
    expect(pane?.right).toBeCloseTo(bar.right, 0);
  });

  it('scrolls the page to the last line while the editor is focused', async () => {
    await page.viewport(1440, 600);
    renderEditor(
      fromDefinition(JSON.parse(definition(...Array.from({ length: 40 }, (_, index) => `Field ${String(index + 1)}`))) as FormDefinition),
    );
    await mode('JSON');
    window.scrollTo(0, 0);
    view().focus();
    await userEvent.wheel(view().dom, { delta: { y: 20000 } });
    await waitFor(() => {
      expect(window.scrollY).toBeGreaterThan(0);
      const last = [...view().dom.querySelectorAll('.cm-line')].at(-1)?.getBoundingClientRect();
      expect(last?.bottom).toBeLessThanOrEqual(window.innerHeight);
    });
  });

  it('keeps the cursor line below the sticky toolbar when it scrolls up to it', async () => {
    await page.viewport(1440, 600);
    renderEditor(
      fromDefinition(JSON.parse(definition(...Array.from({ length: 40 }, (_, index) => `Field ${String(index + 1)}`))) as FormDefinition),
    );
    await mode('JSON');
    const editor = view();
    editor.focus();
    const lineTop = () => editor.coordsAtPos(editor.state.doc.line(3).from)?.top ?? Number.NaN;
    const barBottom = () => document.querySelector('[data-topbar]')?.getBoundingClientRect().bottom ?? Number.NaN;
    window.scrollTo(0, document.documentElement.scrollHeight);
    await waitFor(() => {
      expect(window.scrollY).toBeGreaterThan(1000);
    });
    editor.dispatch({ selection: { anchor: editor.state.doc.line(3).from }, scrollIntoView: true });
    await waitFor(() => {
      expect(lineTop()).toBeGreaterThanOrEqual(barBottom());
    });
  });
});

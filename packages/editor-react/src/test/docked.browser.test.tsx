import { EditorView } from '@codemirror/view';
import { fromDefinition, toDefinition } from '@formhaus/builder';
import type { FormDefinition } from '@formhaus/core';
import { cleanup, screen, waitFor, within } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { page, userEvent } from 'vitest/browser';
import ReactPreview from '../preview/ReactPreview';
import { fieldLabel, renderEditor, topBar } from './harness';

const long = {
  id: 'long',
  title: 'Long form',
  submit: { label: 'Send' },
  fields: Array.from({ length: 30 }, (_, index) => ({ key: `f${String(index)}`, type: 'text', label: `Field ${String(index)}` })),
} as FormDefinition;

const stepped = {
  id: 'stepped',
  title: 'Stepped form',
  submit: { label: 'Send' },
  steps: ['Contact', 'Details', 'Review'].map((title, index) => ({
    id: title.toLowerCase(),
    title,
    fields: [{ key: `q${String(index)}`, type: 'text', label: `Question ${String(index)}` }],
  })),
} as FormDefinition;

function renderDocked(definition: FormDefinition = long) {
  const view = renderEditor(fromDefinition(definition), { host: { Preview: ReactPreview }, split: true });
  view.container.style.height = '700px';
  view.container.querySelector<HTMLElement>('.fh-editor')?.style.setProperty('height', '100%');
  return view;
}

const pane = () => {
  const node = document.querySelector<HTMLElement>('[data-scroll]');
  if (!node) throw new Error('No editor pane');
  return node;
};

describe('the live preview beside the editor', () => {
  afterEach(() => {
    cleanup();
  });

  it('replaces the Preview tab at 1280 px and up', async () => {
    await page.viewport(1280, 800);
    renderDocked();
    expect(screen.queryByRole('radio', { name: 'Preview' })).toBeNull();
    expect(screen.getByRole('complementary', { name: 'Live preview' })).toBeVisible();
    await page.viewport(1279, 800);
    await waitFor(() => {
      expect(screen.getByRole('radio', { name: 'Preview' })).toBeTruthy();
    });
    expect(screen.queryByRole('complementary', { name: 'Live preview' })).toBeNull();
  });

  it('shows every edit in the preview', async () => {
    await page.viewport(1440, 800);
    renderDocked();
    const live = within(screen.getByRole('complementary', { name: 'Live preview' }));
    await live.findByRole('textbox', { name: /Field 0/ });
    await userEvent.fill(fieldLabel(0), 'Work email');
    expect(await live.findByRole('textbox', { name: /Work email/ })).toBeVisible();
  });

  it('shows the steps as tabs above the editor', async () => {
    await page.viewport(1440, 800);
    renderDocked(stepped);
    const steps = within(await screen.findByRole('navigation', { name: 'Steps' }));
    const tabs = () => steps.getAllByRole('button');
    expect(tabs().map((tab) => tab.textContent)).toEqual(['1Contact1 field', '2Details1 field', '3Review1 field']);
    await waitFor(() => {
      const [first, second] = tabs().map((tab) => tab.getBoundingClientRect());
      expect(second?.top).toBe(first?.top);
    });
    await userEvent.click(steps.getByRole('button', { name: /Review/ }));
    await waitFor(() => {
      expect(steps.getByRole('button', { name: /Review/ })).toHaveAttribute('aria-current', 'step');
    });
  });

  it('keeps the tabs when the host does not ask for the split', async () => {
    await page.viewport(1440, 800);
    renderEditor(fromDefinition(long), { host: { Preview: ReactPreview } });
    expect(screen.getByRole('radio', { name: 'Preview' })).toBeTruthy();
    expect(screen.queryByRole('complementary', { name: 'Live preview' })).toBeNull();
  });

  it('keeps unfinished JSON when the window crosses 1280 px', async () => {
    await page.viewport(1440, 800);
    renderDocked();
    await userEvent.click(screen.getByRole('radio', { name: 'JSON' }));
    const view = () => {
      const dom = document.querySelector<HTMLElement>('.cm-editor');
      const found = dom ? EditorView.findFromDOM(dom) : null;
      if (!found) throw new Error('No JSON editor');
      return found;
    };
    await waitFor(() => view());
    const editor = view();
    editor.dispatch({ changes: { from: 0, insert: 'unfinished ' }, userEvent: 'input.type' });
    await page.viewport(1279, 800);
    await waitFor(() => {
      expect(screen.queryByRole('complementary', { name: 'Live preview' })).toBeNull();
    });
    expect(view()).toBe(editor);
    expect(view().state.doc.toString()).toMatch(/^unfinished /);
  });

  it('leaves the builder history alone when undoing inside the preview', async () => {
    await page.viewport(1440, 800);
    const { store } = renderDocked();
    await userEvent.fill(fieldLabel(0), 'Work email');
    const live = within(screen.getByRole('complementary', { name: 'Live preview' }));
    const input = await live.findByRole('textbox', { name: /Work email/ });
    await userEvent.type(input, 'abc');
    await userEvent.keyboard('{ControlOrMeta>}z{/ControlOrMeta}');
    expect(toDefinition(store.getState().form).fields?.[0]).toMatchObject({ label: 'Work email' });
  });

  it('splits the screen in half', async () => {
    await page.viewport(1440, 800);
    renderDocked();
    const editor = pane().getBoundingClientRect().width;
    const live = screen.getByRole('complementary', { name: 'Live preview' }).getBoundingClientRect().width;
    expect(Math.abs(editor - live)).toBeLessThanOrEqual(1);
  });

  it('scrolls the editor inside its pane and keeps the toolbar and the preview in place', async () => {
    await page.viewport(1440, 800);
    renderDocked();
    const live = screen.getByRole('complementary', { name: 'Live preview' });
    const before = live.getBoundingClientRect().top;
    pane().scrollTo(0, 1000);
    await waitFor(() => {
      expect(pane().scrollTop).toBe(1000);
      expect(topBar()).toHaveAttribute('data-stuck');
    });
    expect(window.scrollY).toBe(0);
    expect(topBar().getBoundingClientRect().top).toBeCloseTo(pane().getBoundingClientRect().top, 0);
    expect(live.getBoundingClientRect().top).toBe(before);
  });

  it('switches the preview between desktop and phone widths', async () => {
    await page.viewport(1440, 800);
    renderDocked();
    const live = within(screen.getByRole('complementary', { name: 'Live preview' }));
    const card = () => live.getByRole('region', { name: 'Preview' }).getBoundingClientRect().width;
    const desktop = card();
    await userEvent.click(live.getByRole('radio', { name: 'Phone' }));
    await waitFor(() => {
      expect(card()).toBeLessThan(desktop);
    });
    expect(card()).toBeLessThanOrEqual(375);
  });

  it('shows the payload after a submit', async () => {
    await page.viewport(1440, 800);
    renderDocked();
    const live = within(screen.getByRole('complementary', { name: 'Live preview' }));
    await userEvent.fill(await live.findByRole('textbox', { name: /Field 0/ }), 'hello');
    await userEvent.click(live.getByRole('button', { name: 'Send' }));
    expect(await live.findByText(/nothing was sent/)).toBeVisible();
    expect(live.getByText(/"f0": "hello"/)).toBeVisible();
    await userEvent.click(live.getByRole('button', { name: 'Start over' }));
    await waitFor(() => {
      expect(document.activeElement).toBe(live.getByRole('textbox', { name: /Field 0/ }));
    });
  });
});

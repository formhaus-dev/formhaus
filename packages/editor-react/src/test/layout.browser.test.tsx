import { fromDefinition } from '@formhaus/builder';
import type { FormDefinition } from '@formhaus/core';
import { cleanup, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { page, userEvent } from 'vitest/browser';
import { fieldLabel, renderEditor, topBar } from './harness';

const live: FormDefinition = {
  id: 'contact',
  title: 'Contact',
  submit: { label: 'Send' },
  fields: [{ key: 'name', type: 'text', label: 'Name' }],
};

describe('editor layout details', () => {
  afterEach(() => {
    cleanup();
  });

  it('puts the first card 24px under the toolbar', async () => {
    await page.viewport(1440, 1000);
    renderEditor(fromDefinition(live));
    topBar().style.position = 'static';
    const card = document.querySelector('[class*="formHeader"]');
    expect(card && Math.round(card.getBoundingClientRect().top - topBar().getBoundingClientRect().bottom)).toBe(24);
  });

  it('shows an idle Publish as a calm muted button that still explains itself', async () => {
    await page.viewport(1440, 1000);
    renderEditor(fromDefinition(live, { lockedFrom: live }), { published: { definition: live, version: 3 }, host: { isNew: false } });
    const publish = screen.getByRole('button', { name: 'Publish' });
    const style = getComputedStyle(publish);
    expect(publish).toHaveAttribute('aria-disabled', 'true');
    expect(publish).toHaveAttribute('title', 'Nothing to publish. v3 is live.');
    expect(style.opacity).toBe('1');
    expect(style.cursor).toBe('default');
    expect(style.boxShadow).toBe('none');
    expect(style.backgroundColor).not.toBe(getComputedStyle(document.documentElement).getPropertyValue('--color-action'));
  });

  it('offers a type switch as a neutral chip with the type name', async () => {
    await page.viewport(1440, 1000);
    renderEditor();
    await userEvent.click(fieldLabel(0));
    await userEvent.keyboard('Email');
    const chip = await screen.findByRole('button', { name: 'Switch to Email' });
    expect(getComputedStyle(chip).backgroundColor).toBe('rgba(0, 0, 0, 0)');
    expect(chip.querySelector('svg')).not.toBeNull();
  });
});

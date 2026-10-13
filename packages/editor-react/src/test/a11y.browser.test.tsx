import axe from 'axe-core';
import { cleanup, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { page, userEvent } from 'vitest/browser';
import { fieldLabel, renderEditor } from './harness';

async function violations() {
  const result = await axe.run(document.body, { resultTypes: ['violations'], rules: { region: { enabled: false } } });
  return result.violations.map((violation) => `${violation.id}: ${violation.nodes.map((node) => node.target.join(' ')).join(', ')}`);
}

describe('editor accessibility', () => {
  afterEach(() => {
    cleanup();
  });

  it('has no axe violations on desktop with a selected choice field', async () => {
    await page.viewport(1440, 1000);
    renderEditor();
    await userEvent.click(fieldLabel(0));
    await userEvent.keyboard('Plan');
    await userEvent.click(screen.getByRole('button', { name: /Field type: Short text/ }));
    await userEvent.click(await screen.findByRole('option', { name: /Multiple choice/ }));
    expect(await violations()).toEqual([]);
  });

  it('has no axe violations on a phone with field settings open', async () => {
    await page.viewport(390, 844);
    renderEditor();
    await userEvent.click(fieldLabel(0));
    await userEvent.click(screen.getByRole('button', { name: 'Field actions' }));
    await userEvent.click(await screen.findByRole('menuitem', { name: /Field settings/ }));
    await screen.findByRole('group', { name: 'Field settings' });
    expect(await violations()).toEqual([]);
  });
});

import type { FormDefinition } from '@formhaus/core';
import type { RendererHarness, TestKit } from './fixtures';

const team: FormDefinition = {
  formatVersion: '1.9',
  id: 'team',
  title: '',
  submit: { label: 'Send' },
  fields: [
    {
      key: 'members',
      type: 'group',
      label: 'Members',
      fields: [
        {
          key: 'id',
          type: 'hidden',
          label: 'Member id',
          defaultValue: 'new',
          validation: { pattern: '^[a-z0-9]+$', patternMessage: 'Unknown member' },
        },
        { key: 'name', type: 'text', label: 'Name' },
      ],
    },
  ],
};

export function hiddenInGroupsScenarios(harness: RendererHarness, { it, expect, waitFor, fn, screen }: TestKit): void {
  it('renders no visible control for a hidden item field and submits its value with its item', async () => {
    const onSubmit = fn();
    harness.mount({
      definition: team,
      initialValues: {
        members: [
          { id: 'a1', name: 'Ada' },
          { id: 'b2', name: 'Bo' },
        ],
      },
      confirmRemove: false,
      onSubmit,
    });
    expect(screen.getAllByRole('textbox')).toHaveLength(2);
    expect(screen.queryByText('Member id')).toBeNull();
    await harness.click(screen.getAllByRole('button', { name: /Remove/ })[0]);
    await harness.click(screen.getByRole('button', { name: 'Add' }));
    await harness.click(screen.getByRole('button', { name: 'Send' }));
    await waitFor(() => expect(onSubmit).toHaveBeenCalledWith({ members: [{ id: 'b2', name: 'Bo' }, { id: 'new' }] }, []));
  });

  it('removes an item that holds only hidden values without asking', async () => {
    harness.mount({ definition: team, initialValues: { members: [{ id: 'a1' }] }, onSubmit: fn() });
    await harness.click(screen.getByRole('button', { name: /Remove/ }));
    await waitFor(() => expect(screen.queryAllByRole('textbox')).toHaveLength(0));
  });

  it('shows the error of a hidden item field at form level and not in the error summary', async () => {
    const onSubmit = fn();
    harness.mount({ definition: team, initialValues: { members: [{ id: 'Bad id', name: 'Ada' }] }, errorSummary: true, onSubmit });
    await harness.click(screen.getByRole('button', { name: 'Send' }));
    await waitFor(() => expect(document.querySelector('[data-fh="form-errors"]')?.textContent).toBe('Unknown member'));
    expect(document.querySelector('[data-fh="error-summary"]')).toBeNull();
    expect(screen.getByRole('textbox', { name: 'Name' }).getAttribute('aria-invalid')).not.toBe('true');
    expect(onSubmit).not.toHaveBeenCalled();
  });
}

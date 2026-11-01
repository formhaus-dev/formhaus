import type { DefinitionIssue, FormDefinition } from '@formhaus/core';
import type { RendererHarness, TestKit } from './fixtures';

const crew = (formatVersion = '1.8'): FormDefinition => ({
  formatVersion,
  id: 'crew',
  title: '',
  submit: { label: 'Send' },
  fields: [
    {
      key: 'people',
      type: 'group',
      label: 'People',
      reorderable: true,
      fields: [{ key: 'name', type: 'text', label: 'Name', validation: { required: true } }],
    },
  ],
});

const people = { people: [{ name: 'Ada' }, { name: 'Bo' }, { name: 'Cy' }] };

export function reorderScenarios(harness: RendererHarness, { it, expect, waitFor, fn, screen }: TestKit): void {
  const layout = { groupItem: harness.reorder };
  const status = () => document.querySelector('.fh-group__status')?.textContent?.trim();
  const names = () => screen.getAllByRole('textbox', { name: 'Name' }).map((input) => (input as HTMLInputElement).value);
  const buttons = (name: string) => screen.getAllByRole('button', { name }) as HTMLButtonElement[];

  it('shows move buttons named by the item title and disabled at the ends', () => {
    harness.mount({ definition: crew(), layout, initialValues: people, onSubmit: fn() });
    expect(buttons('Move up').map((button) => button.disabled)).toEqual([true, false, false]);
    expect(buttons('Move down').map((button) => button.disabled)).toEqual([false, false, true]);
    const [up] = buttons('Move up');
    expect(document.getElementById(up.getAttribute('aria-describedby')!)?.textContent).toBe('People 1');
  });

  it('moves an item with its errors, announces it and keeps focus on its buttons', async () => {
    const onSubmit = fn();
    harness.mount({ definition: crew(), layout, initialValues: { people: [{ name: '' }, { name: 'Bo' }] }, onSubmit });
    await harness.click(screen.getByRole('button', { name: 'Send' }));
    await waitFor(() => expect(document.activeElement).toBe(screen.getAllByRole('textbox', { name: 'Name' })[0]));
    await harness.click(buttons('Move down')[0]);
    await waitFor(() => expect(names()).toEqual(['Bo', '']));
    await waitFor(() => expect(status()).toBe('People 1 moved to position 2'));
    expect(screen.getAllByRole('textbox', { name: 'Name' }).map((input) => input.getAttribute('aria-invalid') === 'true')).toEqual([
      false,
      true,
    ]);
    await waitFor(() => expect(document.activeElement).toBe(buttons('Move up')[1]));
    await harness.click(buttons('Move up')[1]);
    await waitFor(() => expect(names()).toEqual(['', 'Bo']));
    await waitFor(() => expect(document.activeElement).toBe(buttons('Move down')[0]));
  });

  it('submits items in their new order', async () => {
    const onSubmit = fn();
    harness.mount({ definition: crew(), layout, initialValues: people, onSubmit });
    await harness.click(buttons('Move up')[2]);
    await harness.click(screen.getByRole('button', { name: 'Send' }));
    await waitFor(() => expect(onSubmit).toHaveBeenCalledWith({ people: [{ name: 'Ada' }, { name: 'Cy' }, { name: 'Bo' }] }, []));
  });

  it('renders no move buttons and warns once when the reorder item is not wired', async () => {
    const onWarning = fn<(issue: DefinitionIssue) => void>();
    const mounted = harness.mount({ definition: crew(), initialValues: people, onSubmit: fn(), onWarning });
    expect(screen.queryAllByRole('button', { name: /Move/ })).toEqual([]);
    await mounted.update({ initialValues: { people: [{ name: 'Ada' }] } });
    const reorder = () => onWarning.mock.calls.filter(([issue]) => issue.message.includes('reorderable'));
    await waitFor(() => expect(reorder()).toHaveLength(1));
    expect(reorder()[0][0].code).toBe('missing-component');
  });

  it('hides move buttons below format 1.8 and when the renderer is read-only', async () => {
    const mounted = harness.mount({ definition: crew('1.7'), layout, initialValues: people, onSubmit: fn() });
    expect(screen.queryAllByRole('button', { name: /Move/ })).toEqual([]);
    await mounted.update({ definition: crew(), readOnly: true });
    await waitFor(() => expect(screen.getAllByRole('textbox', { name: 'Name' })).toHaveLength(3));
    expect(screen.queryAllByRole('button', { name: /Move|Remove/ })).toEqual([]);
  });
}

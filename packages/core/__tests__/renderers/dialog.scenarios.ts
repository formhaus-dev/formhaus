import { dialog, event, inDialog } from './containers.scenarios';
import type { RendererHarness, TestKit } from './fixtures';

export function dialogScenarios(harness: RendererHarness, { it, expect, waitFor, screen }: TestKit): void {
  const button = (name: string) => screen.getByRole('button', { name }) as HTMLButtonElement;
  const names = () => screen.queryAllByRole('textbox', { name: /^Name/ }) as HTMLInputElement[];
  const active = () => document.activeElement;

  it('asks in a dialog before removing a filled item and keeps it on Escape or Cancel', async () => {
    harness.mount({ definition: event, initialValues: { people: [{ name: 'Ada' }, {}] }, onSubmit: () => {} });
    await harness.click(button('Remove Person 1'));
    const modal = await screen.findByRole('dialog', { name: 'Remove Person 1?' });
    expect(modal.getAttribute('aria-describedby')).toBeTruthy();
    expect(document.getElementById(modal.getAttribute('aria-describedby')!)?.textContent).toBe(
      'This removes Person 1 and its answers. This cannot be undone.',
    );
    await waitFor(() => expect(active()?.textContent?.trim()).toBe('Cancel'));
    expect(active()?.closest('dialog')).toBe(modal);
    active()!.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
    await waitFor(() => expect(dialog()).toBeNull());
    await waitFor(() => expect(active()).toBe(button('Remove Person 1')));
    await harness.click(button('Remove Person 1'));
    await harness.click(await inDialog(screen, 'Cancel'));
    await waitFor(() => expect(dialog()).toBeNull());
    await waitFor(() => expect(active()).toBe(button('Remove Person 1')));
    expect(names().map((input) => input.value)).toEqual(['Ada', '']);
    await harness.click(button('Remove Person 2'));
    await waitFor(() => expect(names().map((input) => input.value)).toEqual(['Ada']));
    expect(dialog()).toBeNull();
  });

  it('removes a filled item when the dialog is confirmed and moves focus on', async () => {
    harness.mount({ definition: event, initialValues: { people: [{ name: 'Ada' }, { name: 'Bo' }] }, onSubmit: () => {} });
    await harness.click(button('Remove Person 2'));
    await harness.click(await inDialog(screen, 'Remove Person 2'));
    await waitFor(() => expect(names().map((input) => input.value)).toEqual(['Ada']));
    await waitFor(() => expect(active()).toBe(button('Add person')));
    expect(dialog()).toBeNull();
  });

  it('asks through a custom confirm dialog', async () => {
    const { confirmDialog } = harness.containers ?? {};
    harness.mount({
      definition: event,
      components: { confirmDialog },
      initialValues: { people: [{ name: 'Ada' }, { name: 'Bo' }] },
      onSubmit: () => {},
    });
    await harness.click(button('Remove Person 1'));
    await screen.findByText('Remove Person 1?');
    expect(dialog()).toBeNull();
    await harness.click(button('Yes'));
    await waitFor(() => expect(names().map((input) => input.value)).toEqual(['Bo']));
  });

  it('removes filled items at once when confirmRemove is false', async () => {
    harness.mount({
      definition: event,
      confirmRemove: false,
      initialValues: { people: [{ name: 'Ada' }, { name: 'Bo' }] },
      onSubmit: () => {},
    });
    await harness.click(button('Remove Person 1'));
    await waitFor(() => expect(names().map((input) => input.value)).toEqual(['Bo']));
    expect(dialog()).toBeNull();
  });
}

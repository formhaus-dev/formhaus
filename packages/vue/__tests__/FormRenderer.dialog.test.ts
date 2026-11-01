import { fireEvent, render, screen, waitFor } from '@testing-library/vue';
import { FormEngine, type FormDefinition } from '@formhaus/core';
import { describe, expect, it } from 'vitest';
import { defineComponent, h } from 'vue';
import FormRenderer from '../src/FormRenderer.vue';
import HeadlessFormRenderer from '../src/HeadlessFormRenderer.vue';
import { useSubmitState } from '../src';
import { useFormDirty } from '../src/dirty';

const definition: FormDefinition = {
  formatVersion: '1.8',
  id: 'invite',
  title: 'Invite',
  submit: { label: 'Send', disabled: [{ field: 'agree', neq: true }] },
  fields: [
    { key: 'email', type: 'email', label: 'Email', validation: { required: true } },
    { key: 'agree', type: 'checkbox', label: 'Agree' },
  ],
};

describe('renderer in a dialog', () => {
  it('turns off browser validation and passes attributes through to the form', () => {
    render(HeadlessFormRenderer, {
      props: { definition, onSubmit: () => {} },
      attrs: { 'aria-label': 'Invite a member', 'data-dialog': 'invite', class: 'dialog' },
    });
    const form = screen.getByRole('form', { name: 'Invite a member' }) as HTMLFormElement;
    expect(form.noValidate).toBe(true);
    expect(form.dataset.dialog).toBe('invite');
    expect(form.className).toBe('fh-form dialog');
  });

  it('passes attributes through FormRenderer', () => {
    render(FormRenderer, { props: { definition, onSubmit: () => {} }, attrs: { 'aria-labelledby': 'title' } });
    expect(document.querySelector('form')!.getAttribute('aria-labelledby')).toBe('title');
  });

  it('drives footer buttons through useSubmitState', async () => {
    let finish = () => {};
    render(
      defineComponent({
        setup() {
          const status = useSubmitState();
          return () => [
            h(FormRenderer, {
              ref: status.ref,
              id: 'invite-form',
              definition,
              actionsComponent: () => null,
              onSubmit: () => new Promise<void>((resolve) => (finish = resolve)),
            }),
            h(
              'button',
              { type: 'submit', form: 'invite-form', disabled: !status.canSubmit.value },
              status.submitting.value ? 'Sending' : 'Send',
            ),
          ];
        },
      }),
    );
    const button = () => screen.getByRole('button', { name: /^Send/ }) as HTMLButtonElement;
    expect(button().disabled).toBe(true);
    await fireEvent.update(screen.getByLabelText(/^Email/), 'ada@example.com');
    await fireEvent.click(screen.getByLabelText(/^Agree/));
    expect(button().disabled).toBe(false);
    await fireEvent.click(button());
    await waitFor(() => expect(button().textContent).toBe('Sending'));
    expect(button().disabled).toBe(true);
    finish();
    await waitFor(() => expect(button().textContent).toBe('Send'));
  });

  it('reads the status of an engine and allows submit only on the last step', async () => {
    const engine = new FormEngine({
      id: 'steps',
      title: 'Steps',
      submit: { label: 'Send' },
      steps: [
        { id: 'one', title: 'One', fields: [{ key: 'a', type: 'text', label: 'A' }] },
        { id: 'two', title: 'Two', fields: [{ key: 'b', type: 'text', label: 'B' }] },
      ],
    });
    const status = useSubmitState(engine);
    expect(status.canSubmit.value).toBe(false);
    await engine.next();
    expect(status.canSubmit.value).toBe(true);
  });

  it('exposes unbound functions on the dirty result', () => {
    const { markClean, ref } = useFormDirty();
    ref(null);
    expect(() => markClean()).not.toThrow();
  });
});

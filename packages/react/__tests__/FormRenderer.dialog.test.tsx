import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { FormEngine, type FormDefinition } from '@formhaus/core';
import { schemaParse } from '@formhaus/core/schema';
import { useState } from 'react';
import { describe, expect, it, vi } from 'vitest';
import { FormRenderer, type FormRendererHandle, HeadlessFormRenderer, useSubmitState } from '../src';
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
const email = () => screen.getByLabelText(/^Email/) as HTMLInputElement;

function Dialog({ onSubmit }: { onSubmit: () => Promise<void> }) {
  const status = useSubmitState();
  const [handle, setHandle] = useState<FormRendererHandle | null>(null);
  const [renders, setRenders] = useState(0);
  return (
    <>
      <FormRenderer
        id="invite-form"
        ref={(next) => {
          status.ref(next);
          setHandle(next);
        }}
        definition={definition}
        onSubmit={() => onSubmit()}
        onFieldChange={() => setRenders((count) => count + 1)}
        actionsComponent={() => null}
      />
      <button type="submit" form="invite-form" disabled={!status.canSubmit}>
        {status.submitting ? 'Sending' : 'Send'}
      </button>
      <output data-testid="handle">{handle ? 'ready' : 'none'}</output>
      <output data-testid="renders">{renders}</output>
    </>
  );
}

describe('renderer in a dialog', () => {
  it('turns off browser validation and forwards form attributes', () => {
    render(
      <HeadlessFormRenderer
        definition={definition}
        onSubmit={() => {}}
        aria-label="Invite a member"
        data-dialog="invite"
        style={{ gap: 4 }}
        className="dialog"
      />,
    );
    const form = screen.getByRole('form', { name: 'Invite a member' }) as HTMLFormElement;
    expect(form.noValidate).toBe(true);
    expect(form.dataset.dialog).toBe('invite');
    expect(form.style.gap).toBe('4px');
    expect(form.className).toBe('fh-form dialog');
    expect(form.hasAttribute('onSubmit')).toBe(false);
  });

  it('drives footer buttons through useSubmitState and a stored handle', async () => {
    let finish = () => {};
    render(<Dialog onSubmit={() => new Promise<void>((resolve) => (finish = resolve))} />);
    const button = screen.getByRole('button', { name: 'Send' }) as HTMLButtonElement;
    expect(screen.getByTestId('handle').textContent).toBe('ready');
    expect(button.disabled).toBe(true);
    fireEvent.change(email(), { target: { value: 'ada@example.com' } });
    fireEvent.click(screen.getByLabelText(/^Agree/));
    expect(screen.getByTestId('renders').textContent).toBe('2');
    expect(button.disabled).toBe(false);
    fireEvent.click(button);
    await waitFor(() => expect(screen.getByRole('button', { name: 'Sending' })).toHaveProperty('disabled', true));
    await act(async () => finish());
    expect(screen.getByRole('button', { name: 'Send' })).toHaveProperty('disabled', false);
  });

  it('keeps the handle identity across renders', () => {
    const handles = new Set<FormRendererHandle>();
    const { rerender } = render(
      <FormRenderer ref={(handle) => void (handle && handles.add(handle))} definition={definition} onSubmit={() => {}} />,
    );
    rerender(<FormRenderer ref={(handle) => void (handle && handles.add(handle))} definition={definition} onSubmit={() => {}} />);
    fireEvent.change(email(), { target: { value: 'ada' } });
    expect(handles.size).toBe(1);
  });

  it('reads the status of an engine', async () => {
    const engine = new FormEngine({ ...definition, submit: { label: 'Send' } }, { agree: true });
    function Status() {
      const { canSubmit, validating, submitting } = useSubmitState(engine);
      return <output>{`${canSubmit} ${validating} ${submitting}`}</output>;
    }
    render(<Status />);
    expect(screen.getByRole('status').textContent).toBe('true false false');
    let finish = () => {};
    let sent: Promise<boolean> | undefined;
    await act(async () => {
      engine.setValue('email', 'ada@example.com');
      sent = engine.submit(() => new Promise<void>((resolve) => (finish = resolve)));
    });
    await waitFor(() => expect(screen.getByRole('status').textContent).toBe('false false true'));
    await act(async () => {
      finish();
      await sent;
    });
  });

  it('allows submit only on the last step', async () => {
    const steps: FormDefinition = {
      id: 'steps',
      title: 'Steps',
      submit: { label: 'Send' },
      steps: [
        { id: 'one', title: 'One', fields: [{ key: 'a', type: 'text', label: 'A' }] },
        { id: 'two', title: 'Two', fields: [{ key: 'b', type: 'text', label: 'B' }] },
      ],
    };
    const engine = new FormEngine(steps);
    function Status() {
      return <output>{String(useSubmitState(engine).canSubmit)}</output>;
    }
    render(<Status />);
    expect(screen.getByRole('status').textContent).toBe('false');
    await act(() => engine.next());
    expect(screen.getByRole('status').textContent).toBe('true');
  });

  it('renders form errors above the fields', async () => {
    const { container } = render(
      <FormRenderer
        definition={{ ...definition, submit: { label: 'Send' } }}
        initialValues={{ email: 'ada@example.com' }}
        formErrorsPlacement="top"
        onSubmit={() => ({ ok: false, formErrors: ['Invites are paused'] })}
      />,
    );
    fireEvent.click(screen.getByRole('button', { name: 'Send' }));
    await screen.findByText('Invites are paused');
    const parts = [...container.querySelectorAll('[data-fh="form-errors"], [data-fh="fields"]')].map((node) =>
      node.getAttribute('data-fh'),
    );
    expect(parts).toEqual(['form-errors', 'fields']);
  });

  it('exposes unbound functions on dirty and schema results', async () => {
    const parse = schemaParse({
      '~standard': { version: 1, vendor: 'test', validate: (value) => ({ value }) },
    });
    const { validate, submit } = parse;
    expect(await validate({ email: 'x' })).toEqual({});
    const handler = vi.fn();
    await submit(handler)({ email: 'x' }, []);
    expect(handler).toHaveBeenCalledWith({ email: 'x' }, []);
    let markClean = () => {};
    function Dirty() {
      const dirty = useFormDirty();
      markClean = dirty.markClean;
      return <FormRenderer ref={dirty.ref} definition={definition} onSubmit={() => {}} />;
    }
    render(<Dirty />);
    expect(() => act(() => markClean())).not.toThrow();
  });
});

import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import type { FormDefinition } from '@formhaus/core';
import { createRef, useRef } from 'react';
import { describe, expect, expectTypeOf, it, vi } from 'vitest';
import { FormRenderer, type FormRendererHandle, HeadlessFormRenderer } from '../src';
import { useFormDirty } from '../src/dirty';

const definition: FormDefinition = {
  id: 'profile',
  title: 'Profile',
  submit: { label: 'Save' },
  fields: [{ key: 'name', type: 'text', label: 'Name', validation: { required: true } }],
};
const name = () => screen.getByLabelText(/^Name/) as HTMLInputElement;

describe('renderer handle actions', () => {
  it('submits through the handle and reports the result', async () => {
    const handle = createRef<FormRendererHandle>();
    const onSubmit = vi.fn();
    render(<FormRenderer ref={handle} definition={definition} onSubmit={onSubmit} />);
    await act(async () => expect(await handle.current!.submit()).toBe(false));
    expect(onSubmit).not.toHaveBeenCalled();
    fireEvent.change(name(), { target: { value: 'Ada' } });
    await act(async () => expect(await handle.current!.submit()).toBe(true));
    expect(onSubmit).toHaveBeenCalledWith({ name: 'Ada' }, []);
  });

  it('reads submitting and resets values', async () => {
    const handle = createRef<FormRendererHandle>();
    let finish = () => {};
    render(
      <HeadlessFormRenderer
        ref={handle}
        definition={definition}
        initialValues={{ name: 'Ada' }}
        onSubmit={() => new Promise<void>((resolve) => (finish = resolve))}
      />,
    );
    let sent: Promise<boolean> | undefined;
    act(() => {
      sent = handle.current!.submit();
    });
    await waitFor(() => expect(handle.current!.submitting).toBe(true));
    await act(async () => {
      finish();
      await sent;
    });
    expect(handle.current!.submitting).toBe(false);
    act(() => handle.current!.reset({ name: 'Lin' }));
    expect(handle.current!.engine.values).toEqual({ name: 'Lin' });
  });

  it('submits from a button outside the form through the id', async () => {
    const onSubmit = vi.fn();
    render(
      <>
        <FormRenderer
          id="profile-form"
          definition={definition}
          initialValues={{ name: 'Ada' }}
          onSubmit={onSubmit}
          layout={{ actions: () => null }}
        />
        <button type="submit" form="profile-form">
          Save outside
        </button>
      </>,
    );
    expect(document.querySelector('form')!.id).toBe('profile-form');
    fireEvent.submit(document.getElementById('profile-form')!);
    await waitFor(() => expect(onSubmit).toHaveBeenCalledWith({ name: 'Ada' }, []));
  });

  it('types onSubmit values from the generic', () => {
    type Profile = { name: string };
    <FormRenderer<Profile> definition={definition} onSubmit={(values) => expectTypeOf(values).toEqualTypeOf<Profile>()} />;
    <FormRenderer definition={definition} onSubmit={(values: Profile) => values.name} />;
  });

  it('uses an onValidate passed after mount', async () => {
    const onSubmit = vi.fn();
    const { rerender } = render(
      <FormRenderer definition={definition} initialValues={{ name: 'Ada' }} onSubmit={onSubmit} onValidate={() => null} />,
    );
    rerender(
      <FormRenderer definition={definition} initialValues={{ name: 'Ada' }} onSubmit={onSubmit} onValidate={() => ({ name: 'Taken' })} />,
    );
    fireEvent.click(screen.getByRole('button', { name: 'Save' }));
    await screen.findAllByText('Taken');
    expect(onSubmit).not.toHaveBeenCalled();
  });
});

function Editor({ onDirty }: { onDirty: (state: ReturnType<typeof useFormDirty>) => void }) {
  const form = useRef<FormRendererHandle>(null);
  const state = useFormDirty(form);
  onDirty(state);
  return (
    <>
      <FormRenderer ref={form} definition={definition} initialValues={{ name: 'Ada' }} onSubmit={() => {}} />
      <p data-testid="dirty">{state.dirty ? state.dirtyKeys.join(',') : 'clean'}</p>
    </>
  );
}

describe('useFormDirty', () => {
  it('follows a renderer through its ref', async () => {
    let state: ReturnType<typeof useFormDirty> | undefined;
    render(<Editor onDirty={(next) => (state = next)} />);
    const dirty = () => screen.getByTestId('dirty').textContent;
    expect(dirty()).toBe('clean');
    fireEvent.change(name(), { target: { value: 'Grace' } });
    expect(dirty()).toBe('name');
    fireEvent.change(name(), { target: { value: 'Ada ' } });
    expect(dirty()).toBe('clean');
    fireEvent.change(name(), { target: { value: 'Grace' } });
    act(() => state!.markClean());
    expect(dirty()).toBe('clean');
    act(() => state!.reset({ name: 'Lin' }));
    expect(name().value).toBe('Lin');
    expect(dirty()).toBe('clean');
  });
});

import { fireEvent, render, screen, waitFor } from '@testing-library/vue';
import type { FormDefinition } from '@formhaus/core';
import { describe, expect, it, vi } from 'vitest';
import { defineComponent, h, nextTick, ref, shallowRef } from 'vue';
import FormRenderer from '../src/FormRenderer.vue';
import HeadlessFormRenderer from '../src/HeadlessFormRenderer.vue';
import { useFormDirty } from '../src/dirty';
import type { FormRendererHandle } from '../src/types';

const definition: FormDefinition = {
  id: 'profile',
  title: 'Profile',
  submit: { label: 'Save' },
  fields: [{ key: 'name', type: 'text', label: 'Name', validation: { required: true } }],
};
const name = () => screen.getByLabelText(/^Name/) as HTMLInputElement;

function mount(component: unknown, props: Record<string, unknown>) {
  const handle = ref<FormRendererHandle>();
  render(defineComponent({ setup: () => () => h(component as never, { ref: handle, definition, ...props }) }));
  return handle;
}

describe('renderer handle actions', () => {
  it('submits through the handle and reports the result', async () => {
    const onSubmit = vi.fn();
    const handle = mount(FormRenderer, { onSubmit });
    expect(await handle.value!.submit()).toBe(false);
    await fireEvent.update(name(), 'Ada');
    expect(await handle.value!.submit()).toBe(true);
    expect(onSubmit).toHaveBeenCalledWith({ name: 'Ada' }, []);
  });

  it('reads submitting and resets values', async () => {
    let finish = () => {};
    const handle = mount(HeadlessFormRenderer, {
      initialValues: { name: 'Ada' },
      onSubmit: () => new Promise<void>((resolve) => (finish = resolve)),
    });
    const sent = handle.value!.submit();
    await waitFor(() => expect(handle.value!.submitting).toBe(true));
    finish();
    await sent;
    expect(handle.value!.submitting).toBe(false);
    handle.value!.reset({ name: 'Lin' });
    expect(handle.value!.engine.values).toEqual({ name: 'Lin' });
  });

  it('puts the id on the form element', () => {
    mount(FormRenderer, { id: 'profile-form', onSubmit: () => {} });
    expect(document.querySelector('form')!.id).toBe('profile-form');
  });

  it('uses an onValidate passed after mount', async () => {
    const onSubmit = vi.fn();
    const onValidate = shallowRef<() => Record<string, string> | null>(() => null);
    render(
      defineComponent({
        setup: () => () => h(FormRenderer, { definition, initialValues: { name: 'Ada' }, onSubmit, onValidate: onValidate.value }),
      }),
    );
    onValidate.value = () => ({ name: 'Taken' });
    await nextTick();
    await fireEvent.click(screen.getByRole('button', { name: 'Save' }));
    await screen.findAllByText('Taken');
    expect(onSubmit).not.toHaveBeenCalled();
  });
});

describe('useFormDirty', () => {
  it('follows a renderer that a child mounts later', async () => {
    let state: ReturnType<typeof useFormDirty> | undefined;
    const open = ref(false);
    const Dialog = defineComponent({
      props: { formRef: { type: Function, required: true } },
      setup: (props) => () =>
        open.value
          ? h(FormRenderer, { ref: props.formRef as never, definition, initialValues: { name: 'Ada' }, onSubmit: () => {} })
          : null,
    });
    render(
      defineComponent({
        setup() {
          state = useFormDirty();
          return () => [
            h(Dialog, { formRef: state!.ref }),
            h('p', { 'data-testid': 'dirty' }, state!.dirty.value ? state!.dirtyKeys.value.join(',') : 'clean'),
          ];
        },
      }),
    );
    const dirty = () => screen.getByTestId('dirty').textContent;
    open.value = true;
    await nextTick();
    expect(dirty()).toBe('clean');
    await fireEvent.update(name(), 'Grace');
    expect(dirty()).toBe('name');
    await fireEvent.update(name(), 'Ada ');
    expect(dirty()).toBe('clean');
    await fireEvent.update(name(), 'Grace');
    state!.markClean();
    await nextTick();
    expect(dirty()).toBe('clean');
  });

  it('takes the values of a handle reset as the baseline', async () => {
    const handle = ref<FormRendererHandle>();
    let state: ReturnType<typeof useFormDirty> | undefined;
    render(
      defineComponent({
        setup() {
          state = useFormDirty(handle);
          return () => h(FormRenderer, { ref: handle, definition, onSubmit: () => {} });
        },
      }),
    );
    await fireEvent.update(name(), 'Grace');
    expect(state!.dirty.value).toBe(true);
    handle.value!.reset({ name: 'Lin' });
    expect(state!.dirty.value).toBe(false);
  });
});

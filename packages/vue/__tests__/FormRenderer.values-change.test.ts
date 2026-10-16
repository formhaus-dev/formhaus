import { fireEvent, render, screen } from '@testing-library/vue';
import type { FormDefinition } from '@formhaus/core';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { computed, createSSRApp, defineComponent, effectScope, h, nextTick, ref, shallowRef } from 'vue';
import { renderToString } from 'vue/server-renderer';
import FormRenderer from '../src/FormRenderer.vue';
import HeadlessFormRenderer from '../src/HeadlessFormRenderer.vue';
import { useFormEngine } from '../src/composables/useFormEngine';
import type { FormRendererHandle } from '../src/types';

const definition: FormDefinition = {
  id: 'values-change',
  title: '',
  submit: { label: 'Send' },
  fields: [
    { key: 'name', type: 'text', label: 'Name' },
    { key: 'ref', type: 'hidden', source: { query: 'ref' } },
  ],
};

const other: FormDefinition = { ...definition, id: 'other', fields: [{ key: 'email', type: 'email', label: 'Email' }] };

const qtyDefinition: FormDefinition = {
  id: 'qty',
  title: '',
  submit: { label: 'Send' },
  fields: [{ key: 'qty', type: 'number', label: 'Qty' }],
};

afterEach(() => window.history.replaceState(null, '', '/'));

describe('valuesChange', () => {
  it('fires once on mount with hidden sources applied', () => {
    window.history.replaceState(null, '', '/?ref=ads');
    const onValuesChange = vi.fn();
    render(FormRenderer, { props: { definition, initialValues: { name: 'Ada' }, onValuesChange } });
    expect(onValuesChange.mock.calls).toEqual([[{ name: 'Ada', ref: 'ads' }]]);
    expect(Object.isFrozen(onValuesChange.mock.calls[0][0])).toBe(true);
  });

  it('fires for user edits and handle writes, not for equal values', async () => {
    const handle = ref<FormRendererHandle>();
    const onValuesChange = vi.fn();
    const onFieldChange = vi.fn();
    render(defineComponent({ setup: () => () => h(FormRenderer, { ref: handle, definition, onFieldChange, onValuesChange }) }));
    onValuesChange.mockClear();
    await fireEvent.update(screen.getByLabelText('Name'), 'Ada');
    handle.value!.setValue('name', 'Grace');
    handle.value!.setValue('name', 'Grace');
    expect(onValuesChange.mock.calls).toEqual([[{ name: 'Ada' }], [{ name: 'Grace' }]]);
    expect(onFieldChange).toHaveBeenCalledOnce();
  });

  it('fires when a new definition recreates the form', async () => {
    const onValuesChange = vi.fn();
    const { rerender } = render(HeadlessFormRenderer, { props: { definition, onValuesChange } });
    await rerender({ definition: other, initialValues: { email: 'a@b.co' }, onValuesChange });
    expect(onValuesChange).toHaveBeenLastCalledWith({ email: 'a@b.co' });
  });

  it('stops after unmount', () => {
    const handle = ref<FormRendererHandle>();
    const onValuesChange = vi.fn();
    const { unmount } = render(
      defineComponent({ setup: () => () => h(HeadlessFormRenderer, { ref: handle, definition, onValuesChange }) }),
    );
    const form = handle.value!;
    form.setValue('name', 'Ada');
    expect(form.values).toEqual({ name: 'Ada' });
    unmount();
    form.setValue('name', 'Grace');
    expect(onValuesChange.mock.calls).toEqual([[{}], [{ name: 'Ada' }]]);
  });

  it('does not fire during server rendering', async () => {
    const onValuesChange = vi.fn();
    await renderToString(createSSRApp({ render: () => h(FormRenderer, { definition, onValuesChange }) }));
    expect(onValuesChange).not.toHaveBeenCalled();
  });
});

describe('reactive values', () => {
  it('drives app computeds from the renderer handle', async () => {
    const handle = shallowRef<FormRendererHandle>();
    render(
      defineComponent({
        setup() {
          const total = computed(() => Number(handle.value?.values.qty ?? 0) * 10);
          return () => [h(FormRenderer, { ref: handle, definition: qtyDefinition }), h('p', { 'data-testid': 'total' }, total.value)];
        },
      }),
    );
    await nextTick();
    const seen = [screen.getByTestId('total').textContent];
    handle.value!.setValue('qty', 3);
    await nextTick();
    seen.push(screen.getByTestId('total').textContent);
    expect(seen).toEqual(['0', '30']);
  });

  it('drives app computeds from useFormEngine values', () => {
    const scope = effectScope();
    const form = scope.run(() => useFormEngine(qtyDefinition))!;
    const total = computed(() => Number(form.values.value.qty ?? 0) * 10);
    const seen = [total.value];
    form.engine.setValue('qty', 3);
    seen.push(total.value);
    form.engine.setErrors({ qty: 'Bad' });
    form.engine.setValue('qty', 0);
    seen.push(total.value);
    scope.stop();
    expect(seen).toEqual([0, 30, 0]);
  });
});

import { render, screen } from '@testing-library/vue';
import { FormEngine, type FormDefinition } from '@formhaus/core';
import { describe, expect, it, vi } from 'vitest';
import { defineComponent, h, nextTick, ref, shallowRef } from 'vue';
import FormRenderer from '../src/FormRenderer.vue';
import type { FormRendererHandle } from '../src/types';

const definition: FormDefinition = {
  id: 'nested',
  title: '',
  submit: { label: 'Send' },
  fields: [
    { key: 'qty', type: 'number', label: 'Qty' },
    { key: 'total', type: 'number', label: 'Total' },
  ],
};

const other: FormDefinition = { ...definition, id: 'other', fields: [{ key: 'email', type: 'email', label: 'Email' }] };

type Values = Readonly<Record<string, unknown>>;

function mount(props: Record<string, unknown>, onValuesChange: (values: Values, handle: FormRendererHandle) => void) {
  const handle = ref<FormRendererHandle>();
  const current = shallowRef(props);
  const utils = render(
    defineComponent({
      setup: () => () =>
        h(FormRenderer, { ref: handle, ...current.value, onValuesChange: (values: Values) => onValuesChange(values, handle.value!) }),
    }),
  );
  return { handle, current, utils };
}

function derive(seen: unknown[]) {
  return (values: Values, handle: FormRendererHandle) => {
    seen.push(values);
    const total = Number(values.qty ?? 0) * 10;
    if (values.total !== total) handle.setValue('total', total);
  };
}

describe('valuesChange with writes from the listener', () => {
  it('keeps a value written by the first listener call', async () => {
    const seen: unknown[] = [];
    const { handle } = mount({ definition, initialValues: { qty: 2 } }, derive(seen));
    await nextTick();
    expect(seen).toEqual([{ qty: 2 }, { qty: 2, total: 20 }]);
    expect(handle.value!.values).toEqual({ qty: 2, total: 20 });
    expect(screen.getByLabelText<HTMLInputElement>('Total').value).toBe('20');
  });

  it('keeps every synchronous write from the first listener call', () => {
    const seen: unknown[] = [];
    const { handle } = mount({ definition }, (values, form) => {
      seen.push(values);
      if (values.qty !== undefined) return;
      form.setValue('qty', 1);
      seen.push('between');
      form.setValue('total', 10);
      seen.push('after');
    });
    expect(seen).toEqual([{}, { qty: 1 }, 'between', { qty: 1, total: 10 }, 'after']);
    expect(handle.value!.getValues()).toEqual({ qty: 1, total: 10 });
  });

  it('fires once when the listener only reads', () => {
    const onValuesChange = vi.fn((values: Values) => void values.qty);
    mount({ definition, initialValues: { qty: 2 } }, onValuesChange);
    expect(onValuesChange.mock.calls.map(([values]) => values)).toEqual([{ qty: 2 }]);
  });

  it('ignores the old form after unmount and starts fresh on mount', () => {
    const onValuesChange = vi.fn((values: Values) => values);
    const first = mount({ definition }, onValuesChange);
    const old = first.handle.value!;
    first.utils.unmount();
    old.setValue('qty', 5);
    const second = mount({ definition, initialValues: { qty: 1 } }, onValuesChange);
    old.setValue('qty', 6);
    expect(onValuesChange.mock.calls.map(([values]) => values)).toEqual([{}, { qty: 1 }]);
    expect(second.handle.value!.values).toEqual({ qty: 1 });
  });

  it('ignores the old engine after a new definition', async () => {
    const engines: FormEngine[] = [];
    const subscribe = FormEngine.prototype.subscribeValues;
    const spy = vi.spyOn(FormEngine.prototype, 'subscribeValues').mockImplementation(function (this: FormEngine, listener) {
      engines.push(this);
      return subscribe.call(this, listener);
    });
    const seen: unknown[] = [];
    const { handle, current } = mount({ definition }, (values) => seen.push(values));
    current.value = { definition: other, initialValues: { email: 'a@b.co' } };
    await nextTick();
    spy.mockRestore();
    engines[0].setValue('qty', 5);
    expect(engines).toHaveLength(2);
    expect(seen).toEqual([{}, { email: 'a@b.co' }]);
    expect(handle.value!.values).toEqual({ email: 'a@b.co' });
  });

  it('keeps handle values current after a new definition and nextTick', async () => {
    const seen: unknown[] = [];
    const { handle, current } = mount({ definition, initialValues: { qty: 1 } }, derive(seen));
    current.value = { definition: { ...definition, id: 'again' }, initialValues: { qty: 3 } };
    await nextTick();
    expect(handle.value!.values).toEqual({ qty: 3, total: 30 });
    expect(seen.at(-1)).toEqual({ qty: 3, total: 30 });
    expect(screen.getByLabelText<HTMLInputElement>('Total').value).toBe('30');
  });
});

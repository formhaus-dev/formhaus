import { act, render, screen } from '@testing-library/react';
import type { FormDefinition } from '@formhaus/core';
import { Component, createRef, type ReactNode, StrictMode } from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { FormRenderer, type FormRendererHandle } from '../src';

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

class Boundary extends Component<{ children: ReactNode }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  render() {
    return this.state.failed ? <p>Failed</p> : this.props.children;
  }
}

afterEach(() => window.history.replaceState(null, '', '/'));

function derive(handle: React.RefObject<FormRendererHandle | null>, seen: unknown[]) {
  return (values: Readonly<Record<string, unknown>>) => {
    seen.push(values);
    const total = Number(values.qty ?? 0) * 10;
    if (values.total !== total) handle.current!.setValue('total', total);
  };
}

describe('onValuesChange with writes from the callback', () => {
  it('keeps a value written by the first callback', () => {
    const handle = createRef<FormRendererHandle>();
    const seen: unknown[] = [];
    render(
      <FormRenderer
        ref={handle}
        definition={definition}
        initialValues={{ qty: 2 }}
        onSubmit={() => {}}
        onValuesChange={derive(handle, seen)}
      />,
    );
    expect(seen).toEqual([{ qty: 2 }, { qty: 2, total: 20 }]);
    expect(handle.current!.getValues()).toEqual({ qty: 2, total: 20 });
    expect(screen.getByLabelText<HTMLInputElement>('Total').value).toBe('20');
  });

  it('keeps every synchronous write from the first callback', () => {
    const handle = createRef<FormRendererHandle>();
    const seen: unknown[] = [];
    render(
      <FormRenderer
        ref={handle}
        definition={definition}
        onSubmit={() => {}}
        onValuesChange={(values) => {
          seen.push(values);
          if (values.qty !== undefined) return;
          handle.current!.setValue('qty', 1);
          seen.push('between');
          handle.current!.setValue('total', 10);
          seen.push('after');
        }}
      />,
    );
    expect(seen).toEqual([{}, { qty: 1 }, 'between', { qty: 1, total: 10 }, 'after']);
    expect(handle.current!.getValues()).toEqual({ qty: 1, total: 10 });
  });

  it('fires once when the callback only reads', () => {
    const onValuesChange = vi.fn((values: Readonly<Record<string, unknown>>) => void values.qty);
    render(<FormRenderer definition={definition} initialValues={{ qty: 2 }} onSubmit={() => {}} onValuesChange={onValuesChange} />);
    expect(onValuesChange.mock.calls).toEqual([[{ qty: 2 }]]);
  });

  it('ignores the old form after unmount and starts fresh on mount', () => {
    const handle = createRef<FormRendererHandle>();
    const onValuesChange = vi.fn();
    const first = render(<FormRenderer ref={handle} definition={definition} onSubmit={() => {}} onValuesChange={onValuesChange} />);
    const old = handle.current!;
    first.unmount();
    old.setValue('qty', 5);
    render(
      <FormRenderer ref={handle} definition={definition} initialValues={{ qty: 1 }} onSubmit={() => {}} onValuesChange={onValuesChange} />,
    );
    old.setValue('qty', 6);
    expect(onValuesChange.mock.calls).toEqual([[{}], [{ qty: 1 }]]);
  });

  it('ignores the old engine after a new definition', () => {
    const handle = createRef<FormRendererHandle>();
    const seen: unknown[] = [];
    const onValuesChange = (values: Readonly<Record<string, unknown>>) => seen.push(values);
    const { rerender } = render(<FormRenderer ref={handle} definition={definition} onSubmit={() => {}} onValuesChange={onValuesChange} />);
    const old = handle.current!;
    rerender(
      <FormRenderer
        ref={handle}
        definition={other}
        initialValues={{ email: 'a@b.co' }}
        onSubmit={() => {}}
        onValuesChange={onValuesChange}
      />,
    );
    act(() => old.setValue('qty', 5));
    expect(seen).toEqual([{}, { email: 'a@b.co' }]);
    expect(handle.current!.getValues()).toEqual({ email: 'a@b.co' });
  });

  it('keeps a first-callback write in StrictMode without duplicates', () => {
    const handle = createRef<FormRendererHandle>();
    const seen: unknown[] = [];
    render(
      <StrictMode>
        <FormRenderer
          ref={handle}
          definition={definition}
          initialValues={{ qty: 2 }}
          onSubmit={() => {}}
          onValuesChange={derive(handle, seen)}
        />
      </StrictMode>,
    );
    expect(seen).toEqual([{ qty: 2 }, { qty: 2, total: 20 }]);
    expect(handle.current!.getValues()).toEqual({ qty: 2, total: 20 });
  });

  it('applies hidden sources once in StrictMode when the callback rewrites them', () => {
    window.history.replaceState(null, '', '/?ref=ads');
    const sourced: FormDefinition = { ...definition, fields: [{ key: 'ref', type: 'hidden', source: { query: 'ref' } }] };
    const handle = createRef<FormRendererHandle>();
    const seen: unknown[] = [];
    render(
      <StrictMode>
        <FormRenderer
          ref={handle}
          definition={sourced}
          onSubmit={() => {}}
          onValuesChange={(values) => {
            seen.push(values);
            if (values.ref === 'ads') handle.current!.setValue('ref', 'normalized');
          }}
        />
      </StrictMode>,
    );
    expect(seen).toEqual([{ ref: 'ads' }, { ref: 'normalized' }]);
  });

  it('stops listening when the first callback throws', () => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
    const handle = createRef<FormRendererHandle>();
    let form: FormRendererHandle | null = null;
    const onValuesChange = vi.fn(() => {
      form = handle.current;
      throw new Error('boom');
    });
    render(
      <Boundary>
        <FormRenderer ref={handle} definition={definition} onSubmit={() => {}} onValuesChange={onValuesChange} />
      </Boundary>,
    );
    expect(screen.getByText('Failed')).toBeTruthy();
    const calls = onValuesChange.mock.calls.length;
    act(() => form!.setValue('qty', 1));
    expect(onValuesChange).toHaveBeenCalledTimes(calls);
    vi.restoreAllMocks();
  });
});

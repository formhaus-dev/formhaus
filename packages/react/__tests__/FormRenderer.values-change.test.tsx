import { act, fireEvent, render, screen } from '@testing-library/react';
import type { FormDefinition } from '@formhaus/core';
import { createRef } from 'react';
import { renderToString } from 'react-dom/server';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { FormRenderer, type FormRendererHandle, HeadlessFormRenderer } from '../src';

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

afterEach(() => window.history.replaceState(null, '', '/'));

describe('onValuesChange', () => {
  it('fires once on mount with hidden sources applied', () => {
    window.history.replaceState(null, '', '/?ref=ads');
    const onValuesChange = vi.fn();
    render(<FormRenderer definition={definition} initialValues={{ name: 'Ada' }} onSubmit={() => {}} onValuesChange={onValuesChange} />);
    expect(onValuesChange.mock.calls).toEqual([[{ name: 'Ada', ref: 'ads' }]]);
    expect(Object.isFrozen(onValuesChange.mock.calls[0][0])).toBe(true);
  });

  it('fires for user edits and handle writes, not for equal values', () => {
    const handle = createRef<FormRendererHandle>();
    const onValuesChange = vi.fn();
    const onFieldChange = vi.fn();
    render(
      <FormRenderer
        ref={handle}
        definition={definition}
        onSubmit={() => {}}
        onFieldChange={onFieldChange}
        onValuesChange={onValuesChange}
      />,
    );
    onValuesChange.mockClear();
    fireEvent.change(screen.getByLabelText('Name'), { target: { value: 'Ada' } });
    act(() => handle.current!.setValue('name', 'Grace'));
    act(() => handle.current!.setValue('name', 'Grace'));
    expect(onValuesChange.mock.calls).toEqual([[{ name: 'Ada' }], [{ name: 'Grace' }]]);
    expect(onFieldChange).toHaveBeenCalledOnce();
  });

  it('fires when a new definition recreates the form', () => {
    const onValuesChange = vi.fn();
    const { rerender } = render(<FormRenderer definition={definition} onSubmit={() => {}} onValuesChange={onValuesChange} />);
    rerender(<FormRenderer definition={other} initialValues={{ email: 'a@b.co' }} onSubmit={() => {}} onValuesChange={onValuesChange} />);
    expect(onValuesChange).toHaveBeenLastCalledWith({ email: 'a@b.co' });
  });

  it('calls the latest callback and stops after unmount', () => {
    const handle = createRef<FormRendererHandle>();
    const first = vi.fn();
    const second = vi.fn();
    const { rerender, unmount } = render(
      <HeadlessFormRenderer ref={handle} definition={definition} onSubmit={() => {}} onValuesChange={first} />,
    );
    rerender(<HeadlessFormRenderer ref={handle} definition={definition} onSubmit={() => {}} onValuesChange={second} />);
    const form = handle.current!;
    act(() => form.setValue('name', 'Ada'));
    unmount();
    form.setValue('name', 'Grace');
    expect(first).toHaveBeenCalledOnce();
    expect(second.mock.calls).toEqual([[{ name: 'Ada' }]]);
  });

  it('does not fire during server rendering', () => {
    const onValuesChange = vi.fn();
    renderToString(<FormRenderer definition={definition} onSubmit={() => {}} onValuesChange={onValuesChange} />);
    expect(onValuesChange).not.toHaveBeenCalled();
  });
});

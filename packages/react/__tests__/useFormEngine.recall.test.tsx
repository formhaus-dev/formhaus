import { act, fireEvent, render, renderHook, screen } from '@testing-library/react';
import type { FormDefinition } from '@formhaus/core';
import { useState } from 'react';
import { describe, expect, it } from 'vitest';
import { FormRenderer, useFormEngine } from '../src';

const definition: FormDefinition = {
  formatVersion: '1.5',
  id: 'recall',
  title: '',
  submit: { label: 'Send' },
  fields: [
    { key: 'name', type: 'text', label: 'Name' },
    { key: 'note', type: 'text', label: 'Note for {{name}}' },
  ],
};

describe('recall formatter identity', () => {
  it('renders a bounded number of times with an inline formatter', () => {
    let renders = 0;
    const { result } = renderHook(() => {
      renders++;
      return useFormEngine(definition, undefined, { formatRecall: (value) => String(value) });
    });
    act(() => result.current.setValue('name', 'Ada'));
    act(() => result.current.setValue('name', 'Bo'));
    expect(renders).toBeLessThan(8);
  });

  it('keeps a renderer with an inline formatter in a rerendering parent stable', () => {
    let renders = 0;
    function Form() {
      const [, setValues] = useState({});
      renders++;
      return (
        <FormRenderer
          definition={definition}
          onSubmit={() => {}}
          onValuesChange={setValues}
          formatRecall={(value) => `<${String(value)}>`}
        />
      );
    }
    render(<Form />);
    fireEvent.change(screen.getByRole('textbox', { name: /^Name/ }), { target: { value: 'Ada' } });
    expect(screen.getByRole('textbox', { name: /^Note for <Ada>/ })).toBeTruthy();
    expect(renders).toBeLessThan(8);
  });
});

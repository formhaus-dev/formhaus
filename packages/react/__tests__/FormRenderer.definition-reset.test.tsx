import { fireEvent, render, screen } from '@testing-library/react';
import type { FormDefinition } from '@formhaus/core';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { FormRenderer } from '../src';

const definition: FormDefinition = {
  id: 'reset',
  title: '',
  submit: { label: 'Send' },
  fields: [{ key: 'name', type: 'text', label: 'Name' }],
};

const input = () => screen.getByLabelText('Name') as HTMLInputElement;
const type = (value: string) => fireEvent.change(input(), { target: { value } });

afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllEnvs();
});

describe('definition changes', () => {
  it('warns once when a new definition object has the same content, and resets the form', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const { rerender } = render(<FormRenderer definition={definition} initialValues={{ name: 'Ada' }} onSubmit={() => {}} />);
    type('Grace');
    rerender(<FormRenderer definition={structuredClone(definition)} initialValues={{ name: 'Ada' }} onSubmit={() => {}} />);
    expect(input().value).toBe('Ada');
    rerender(<FormRenderer definition={structuredClone(definition)} initialValues={{ name: 'Ada' }} onSubmit={() => {}} />);
    expect(warn.mock.calls).toEqual([
      [
        '[formhaus] FormRenderer got a new definition object with the same content and reset the form. Keep the definition in a constant or useMemo.',
      ],
    ]);
  });

  it('resets without a warning when the definition content changes', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const { rerender } = render(<FormRenderer definition={definition} onSubmit={() => {}} />);
    type('Grace');
    const changed = { ...definition, fields: [{ key: 'name', type: 'text', label: 'Name', defaultValue: 'Lin' }] };
    rerender(<FormRenderer definition={changed} onSubmit={() => {}} />);
    expect(input().value).toBe('Lin');
    expect(warn).not.toHaveBeenCalled();
  });

  it('keeps the form when the same definition object renders again', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const { rerender } = render(<FormRenderer definition={definition} initialValues={{ name: 'Ada' }} onSubmit={() => {}} />);
    type('Grace');
    rerender(<FormRenderer definition={definition} initialValues={{ name: 'Lin' }} onSubmit={() => {}} />);
    expect(input().value).toBe('Grace');
    expect(warn).not.toHaveBeenCalled();
  });

  it('sends the warning to onWarning', () => {
    const onWarning = vi.fn();
    const { rerender } = render(<FormRenderer definition={definition} onSubmit={() => {}} onWarning={onWarning} />);
    rerender(<FormRenderer definition={{ ...definition }} onSubmit={() => {}} onWarning={onWarning} />);
    expect(onWarning.mock.calls.map(([issue]) => [issue.code, issue.severity, issue.hint])).toEqual([
      ['definition-reset', 'warning', 'Keep the definition in a constant or useMemo.'],
    ]);
  });

  it('does not warn in production', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    vi.stubEnv('NODE_ENV', 'production');
    const { rerender } = render(<FormRenderer definition={definition} onSubmit={() => {}} />);
    rerender(<FormRenderer definition={{ ...definition }} onSubmit={() => {}} />);
    expect(warn).not.toHaveBeenCalled();
  });
});

import { fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useState } from 'react';
import { describe, expect, it, vi } from 'vitest';
import { InlineText, type InlineTextProps } from './InlineText';

function Harness(props: Partial<InlineTextProps>) {
  const [value, setValue] = useState('');
  return <InlineText label="Question" value={value} onValueChange={setValue} placeholder="Question" {...props} />;
}

describe('InlineText', () => {
  it('edits a single line and calls onEnter instead of inserting a newline', async () => {
    const onEnter = vi.fn();
    render(<Harness onEnter={onEnter} />);
    const input = screen.getByRole('textbox', { name: 'Question' });
    await userEvent.type(input, 'Email{Enter}');
    expect(input).toHaveValue('Email');
    expect(onEnter).toHaveBeenCalledTimes(1);
  });

  it('keeps pasted newlines out of single-line text', () => {
    const onValueChange = vi.fn();
    render(<InlineText label="Question" value="" onValueChange={onValueChange} />);
    fireEvent.change(screen.getByRole('textbox'), { target: { value: 'One\nTwo' } });
    expect(onValueChange).toHaveBeenCalledWith('One Two');
  });

  it('allows Shift+Enter newlines when multiline', async () => {
    render(<Harness multiline />);
    const input = screen.getByRole('textbox', { name: 'Question' });
    await userEvent.type(input, 'One{Shift>}{Enter}{/Shift}Two');
    expect(input).toHaveValue('One\nTwo');
  });

  it('calls onEscape and focuses the field from anywhere in its row', async () => {
    const onEscape = vi.fn();
    const { container } = render(<Harness onEscape={onEscape} rowClassName="row" />);
    const row = container.querySelector('.row');
    if (!row) throw new Error('row missing');
    fireEvent.pointerDown(row);
    const input = screen.getByRole('textbox', { name: 'Question' });
    expect(input).toHaveFocus();
    await userEvent.keyboard('{Escape}');
    expect(onEscape).toHaveBeenCalledTimes(1);
  });
});

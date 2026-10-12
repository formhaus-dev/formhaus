import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { RadioGroup } from './RadioGroup';

const options = [
  { value: 'message', label: 'Show a message' },
  { value: 'redirect', label: 'Redirect', hint: 'To your own page.' },
  { value: 'none', label: 'Nothing', disabled: true },
];

describe('RadioGroup', () => {
  it('reports the chosen value and groups radios under a legend', async () => {
    const onValueChange = vi.fn();
    render(<RadioGroup legend="After submit" options={options} defaultValue="message" onValueChange={onValueChange} />);
    expect(screen.getByRole('group', { name: 'After submit' })).toBeInTheDocument();
    expect(screen.getByRole('radio', { name: 'Show a message' })).toBeChecked();
    await userEvent.click(screen.getByRole('radio', { name: /Redirect/ }));
    expect(onValueChange).toHaveBeenCalledWith('redirect');
    expect(screen.getByRole('radio', { name: 'Nothing' })).toBeDisabled();
  });
});

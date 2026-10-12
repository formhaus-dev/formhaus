import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { SegmentedControl } from './SegmentedControl';

describe('SegmentedControl', () => {
  it('selects one segment at a time', async () => {
    const onValueChange = vi.fn();
    render(
      <SegmentedControl
        label="Period"
        defaultValue="7d"
        onValueChange={onValueChange}
        options={[
          { value: '7d', label: '7 days' },
          { value: '30d', label: '30 days' },
        ]}
      />,
    );
    expect(screen.getByRole('radiogroup', { name: 'Period' })).toBeInTheDocument();
    await userEvent.click(screen.getByRole('radio', { name: '30 days' }));
    expect(screen.getByRole('radio', { name: '30 days' })).toBeChecked();
    expect(screen.getByRole('radio', { name: '7 days' })).not.toBeChecked();
    expect(onValueChange).toHaveBeenCalledWith('30d');
  });
});

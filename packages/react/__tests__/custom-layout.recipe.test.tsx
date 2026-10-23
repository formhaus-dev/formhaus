import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { CustomLayoutForm } from '../../../docs/recipes/snippets/custom-layout';
import { signup, signupErrors } from '../../core/__tests__/renderers/fixtures';

describe('fully custom layout recipe', () => {
  it('lists errors from every step and opens the step of a field', async () => {
    render(<CustomLayoutForm definition={signup} send={signupErrors} />);
    fireEvent.change(screen.getByRole('textbox', { name: 'Name' }), { target: { value: 'Ada' } });
    fireEvent.click(screen.getByRole('button', { name: 'Next' }));
    fireEvent.click(await screen.findByRole('button', { name: 'Send' }));
    expect(await screen.findByRole('alert')).toHaveProperty('textContent', 'Server down');
    expect(screen.getByRole('navigation', { name: '2 errors' }).textContent).toBe('Name: TakenCity: Unknown');
    fireEvent.click(screen.getByRole('link', { name: 'City: Unknown' }));
    await waitFor(() => expect(document.activeElement).toBe(screen.getByRole('textbox', { name: 'City' })));
  });
});

import { fireEvent, render, screen, waitFor } from '@testing-library/vue';
import { describe, expect, it } from 'vitest';
import CustomLayoutForm from '../../../docs/recipes/snippets/custom-layout.vue';
import { signup, signupErrors } from '../../core/__tests__/renderers/fixtures';

describe('fully custom layout recipe', () => {
  it('lists errors from every step and opens the step of a field', async () => {
    render(CustomLayoutForm, { props: { definition: signup, send: signupErrors } });
    await fireEvent.update(screen.getByRole('textbox', { name: 'Name' }), 'Ada');
    await fireEvent.click(screen.getByRole('button', { name: 'Next' }));
    await fireEvent.click(await screen.findByRole('button', { name: 'Send' }));
    expect(await screen.findByRole('alert')).toHaveProperty('textContent', 'Server down');
    expect(screen.getByRole('navigation', { name: '2 errors' }).textContent).toBe('Name: TakenCity: Unknown');
    await fireEvent.click(screen.getByRole('link', { name: 'City: Unknown' }));
    await waitFor(() => expect(document.activeElement).toBe(screen.getByRole('textbox', { name: 'City' })));
  });
});

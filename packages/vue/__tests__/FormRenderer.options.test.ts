import { fireEvent, render, screen, waitFor } from '@testing-library/vue';
import type { FieldOption, FormDefinition } from '@formhaus/core';
import { describe, expect, it } from 'vitest';
import FormRenderer from '../src/FormRenderer.vue';

interface PendingOptions {
  country: unknown;
  resolve: (options: FieldOption[]) => void;
}

const definition: FormDefinition = {
  id: 'dynamic-options',
  title: 'Dynamic options',
  submit: { label: 'Submit' },
  fields: [
    { key: 'country', type: 'text', label: 'Country' },
    {
      key: 'city',
      type: 'select',
      label: 'City',
      optionsFrom: 'cities',
      optionsDependsOn: ['country'],
    },
  ],
};

describe('FormRenderer dynamic options', () => {
  it('ignores an older provider response', async () => {
    const pending: PendingOptions[] = [];
    const cities = (values: Record<string, unknown>) => new Promise<FieldOption[]>((resolve) => {
      pending.push({ country: values.country, resolve });
    });
    render(FormRenderer, {
      props: {
        definition,
        initialValues: { country: 'US' },
        optionsProviders: { cities },
      },
    });
    await waitFor(() => expect(pending).toHaveLength(1));

    await fireEvent.update(screen.getByRole('textbox', { name: 'Country' }), 'JP');
    await waitFor(() => expect(pending).toHaveLength(2));

    pending[1].resolve([{ value: 'tokyo', label: 'Tokyo' }]);
    expect(await screen.findByText('Tokyo')).toBeDefined();
    pending[0].resolve([{ value: 'new-york', label: 'New York' }]);

    await waitFor(() => expect(screen.queryByText('New York')).toBeNull());
    expect(screen.getByText('Tokyo')).toBeDefined();
  });
});

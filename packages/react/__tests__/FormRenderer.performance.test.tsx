import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import type { FormDefinition } from '@formhaus/core';
import { beforeEach, describe, expect, it } from 'vitest';
import { FormRenderer } from '../src/FormRenderer';
import type { FieldComponentProps } from '../src/types';

const renderCounts = new Map<string, number>();

function CountedField({ field, value, onChange }: FieldComponentProps) {
  renderCounts.set(field.key, (renderCounts.get(field.key) ?? 0) + 1);
  const nextValue = value === 'US' ? 'JP' : value === 'JP' ? 'CA' : `${String(value ?? '')}x`;
  const options = field.options?.map((option) => option.label).join(',') ?? '';

  return (
    <button type="button" onClick={() => onChange(nextValue)}>
      {field.label}:{String(value ?? '')}:{options}
    </button>
  );
}

function createValueOnlyDefinition(fieldCount: number): FormDefinition {
  return {
    id: `value-only-${fieldCount}`,
    title: 'Value-only fields',
    submit: { label: 'Submit' },
    fields: Array.from({ length: fieldCount }, (_, index) => ({
      key: `field-${index}`,
      type: 'counted',
      label: `Field ${index}`,
    })),
  };
}

describe('FormRenderer field isolation', () => {
  beforeEach(() => {
    renderCounts.clear();
  });

  it('renders only the changed field in a 100-field form', () => {
    const definition = createValueOnlyDefinition(100);
    const components = { counted: CountedField };
    render(<FormRenderer definition={definition} components={components} onSubmit={() => {}} />);
    renderCounts.clear();

    fireEvent.click(screen.getByRole('button', { name: 'Field 0::' }));

    expect(renderCounts.get('field-0')).toBe(1);
    for (let index = 1; index < 100; index++) {
      expect(renderCounts.has(`field-${index}`)).toBe(false);
    }
  });

  it('renders only fields whose dynamic options changed', async () => {
    const definition: FormDefinition = {
      id: 'dynamic-options-isolation',
      title: 'Dynamic options isolation',
      submit: { label: 'Submit' },
      fields: [
        { key: 'country', type: 'counted', label: 'Country' },
        {
          key: 'city',
          type: 'counted',
          label: 'City',
          optionsFrom: 'cities',
          optionsDependsOn: ['country'],
        },
        ...Array.from({ length: 98 }, (_, index) => ({
          key: `other-${index}`,
          type: 'counted',
          label: `Other ${index}`,
        })),
      ],
    };
    const components = { counted: CountedField };
    const sharedTokyoOptions = [{ value: 'tokyo', label: 'Tokyo' }];
    const optionsProviders = {
      cities: (values: Record<string, unknown>) => {
        if (values.country === 'US') {
          return [{ value: 'new-york', label: 'New York' }];
        }
        return sharedTokyoOptions.map((option) => ({ ...option }));
      },
    };
    render(
      <FormRenderer
        definition={definition}
        initialValues={{ country: 'US' }}
        components={components}
        optionsProviders={optionsProviders}
        onSubmit={() => {}}
      />,
    );
    await screen.findByRole('button', { name: 'City::New York' });
    renderCounts.clear();

    fireEvent.click(screen.getByRole('button', { name: 'Country:US:' }));

    await screen.findByRole('button', { name: 'City::Tokyo' });
    expect(renderCounts.get('country')).toBe(1);
    expect(renderCounts.get('city')).toBe(1);
    for (let index = 0; index < 98; index++) {
      expect(renderCounts.has(`other-${index}`)).toBe(false);
    }

    renderCounts.clear();
    fireEvent.click(screen.getByRole('button', { name: 'Country:JP:' }));
    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'Country:CA:' })).toBeDefined();
    });

    expect(renderCounts.get('country')).toBe(1);
    expect(renderCounts.has('city')).toBe(false);
  });
});

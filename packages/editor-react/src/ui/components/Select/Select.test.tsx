import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { Field } from '../Field/Field';
import { Select } from './Select';

const roles = [
  { value: 'owner', label: 'Owner' },
  { value: 'editor', label: 'Editor' },
  { value: 'viewer', label: 'Viewer', disabled: true },
];

describe('Select', () => {
  it('selects an option by label', async () => {
    render(
      <Field label="Role">
        <Select options={roles} defaultValue="editor" />
      </Field>,
    );
    const select = screen.getByRole('combobox', { name: 'Role' });
    expect(select).toHaveValue('editor');
    await userEvent.selectOptions(select, 'Owner');
    expect(select).toHaveValue('owner');
    expect(screen.getByRole('option', { name: 'Viewer' })).toBeDisabled();
  });
});

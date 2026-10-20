import type { FormDefinition, FormField } from '@formhaus/core';
import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { FormRenderer } from '../src/FormRenderer';

const single = (...fields: FormField[]): FormDefinition => ({
  formatVersion: '1.3',
  id: 'f',
  title: 'F',
  submit: { label: 'Send' },
  fields,
});

const radio = (name: string, value: number) => document.querySelector<HTMLInputElement>(`input[name="${name}"][value="${value}"]`)!;

describe('matrix section', () => {
  const agree = [
    { value: '1', label: 'Disagree' },
    { value: '2', label: 'Agree' },
  ];

  it('renders a column header from the first row and one radio group per row', () => {
    render(
      <FormRenderer
        definition={single({
          key: 'pulse',
          type: 'section',
          layout: 'matrix',
          title: 'Pulse',
          fields: [
            { key: 'clear', type: 'radio', label: 'Clear', options: agree },
            { key: 'heard', type: 'radio', label: 'Heard', options: agree },
          ],
        } as unknown as FormField)}
        onSubmit={() => {}}
      />,
    );
    const section = screen.getByRole('group', { name: 'Pulse' });
    expect(section.className).toBe('fh-section fh-section--matrix');
    expect(section.style.getPropertyValue('--fhi-matrix-columns')).toBe('2');
    const header = section.querySelector('.fh-section__matrix-header')!;
    expect(header.getAttribute('aria-hidden')).toBe('true');
    expect(header.textContent).toBe('DisagreeAgree');
    expect(screen.getByRole('group', { name: 'Heard' }).querySelectorAll('input[type="radio"]')).toHaveLength(2);
    fireEvent.click(screen.getAllByLabelText('Agree')[1]);
    expect(radio('heard', 2).checked).toBe(true);
  });

  it('keeps each row a group named by its label with the error inside the row', async () => {
    render(
      <FormRenderer
        definition={single({
          key: 'pulse',
          type: 'section',
          layout: 'matrix',
          title: 'Pulse',
          fields: [
            { key: 'clear', type: 'radio', label: 'Clear', options: agree, validation: { required: true } },
            { key: 'heard', type: 'radio', label: 'Heard', options: agree, validation: { required: true } },
          ],
        } as unknown as FormField)}
        onSubmit={() => {}}
        errorSummary={false}
      />,
    );
    fireEvent.click(screen.getAllByRole('radio', { name: 'Agree' })[0]!);
    fireEvent.click(screen.getByRole('button', { name: 'Send' }));
    const heard = screen.getByRole('group', { name: 'Heard required' });
    const error = await screen.findByRole('alert');
    expect(error.parentElement).toBe(heard);
    expect(heard.getAttribute('aria-describedby')).toBe(error.id);
    expect(screen.getByRole('group', { name: 'Clear required' }).getAttribute('aria-invalid')).toBeNull();
    expect(screen.getAllByRole('radio', { name: 'Disagree' })).toHaveLength(2);
  });

  it('renders a plain section without layout', () => {
    render(
      <FormRenderer
        definition={single({ key: 'note', type: 'section', title: 'Note', fields: [] } as unknown as FormField)}
        onSubmit={() => {}}
      />,
    );
    const section = screen.getByRole('group', { name: 'Note' });
    expect(section.className).toBe('fh-section');
    const body = section.querySelector('.fh-section__body')!;
    expect([body.children.length, body.textContent]).toEqual([0, '']);
  });
});

import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import type { FormDefinition } from '@formhaus/core';
import { describe, expect, it, vi } from 'vitest';
import { FormRenderer } from '../src/FormRenderer';

const steps: FormDefinition = {
  id: 'spec',
  title: '',
  submit: { label: 'Finish', disabled: [{ field: 'agree', eq: false }] },
  steps: [
    {
      id: 'one',
      title: 'One',
      next: { label: 'Onward' },
      fields: [{ key: 'name', type: 'text', label: 'Name', validation: { required: true } }],
    },
    { id: 'two', title: 'Two', back: false, fields: [{ key: 'city', type: 'text', label: 'City' }] },
    { id: 'three', title: 'Three', next: false, fields: [{ key: 'agree', type: 'checkbox', label: 'Agree', defaultValue: false }] },
  ],
};

const rsvp: FormDefinition = {
  id: 'rsvp',
  title: '',
  submit: { label: 'Send RSVP' },
  steps: [
    {
      id: 'reply',
      title: 'Reply',
      fields: [
        {
          key: 'attending',
          type: 'radio',
          label: 'Coming?',
          options: [
            { value: 'yes', label: 'Yes' },
            { value: 'no', label: 'No' },
          ],
          validation: { required: true },
        },
      ],
    },
    {
      id: 'details',
      title: 'Details',
      show: [{ field: 'attending', eq: 'yes' }],
      fields: [{ key: 'partySize', type: 'number', label: 'Party size', defaultValue: 1, validation: { required: true } }],
    },
  ],
};

const blanks: FormDefinition = {
  id: 'blanks',
  title: '',
  submit: { label: 'Save' },
  fields: [
    { key: 'name', type: 'text', label: 'Name' },
    { key: 'age', type: 'number', label: 'Age' },
    { key: 'ok', type: 'checkbox', label: 'OK' },
    { key: 'untouched', type: 'text', label: 'Untouched' },
  ],
};

describe('renderer spec rules', () => {
  it('hides Back on the first step and with back: false, uses next.label, and keeps Submit with next: false', async () => {
    render(<FormRenderer definition={steps} initialValues={{ name: 'Ada' }} onSubmit={() => {}} />);
    expect(screen.queryByRole('button', { name: 'Back' })).toBeNull();
    fireEvent.click(screen.getByRole('button', { name: 'Onward' }));
    await screen.findByLabelText('City');
    expect(screen.queryByRole('button', { name: 'Back' })).toBeNull();
    fireEvent.click(screen.getByRole('button', { name: 'Continue' }));
    const finish = await screen.findByRole('button', { name: 'Finish' });
    await waitFor(() => expect((finish as HTMLButtonElement).disabled).toBe(true));
    fireEvent.click(screen.getByLabelText('Agree'));
    await waitFor(() => expect((finish as HTMLButtonElement).disabled).toBe(false));
  });

  it('never disables Submit for an empty disabled list and does not validate on blur', () => {
    const definition: FormDefinition = {
      id: 'one',
      title: '',
      submit: { label: 'Send', disabled: [] },
      fields: [{ key: 'name', type: 'text', label: 'Name', validation: { required: true } }],
    };
    render(<FormRenderer definition={definition} onSubmit={() => {}} />);
    expect((screen.getByRole('button', { name: 'Send' }) as HTMLButtonElement).disabled).toBe(false);
    fireEvent.blur(screen.getByLabelText(/Name/));
    expect(screen.queryByRole('alert')).toBeNull();
  });

  it('writes File or null, string[], boolean and number values, and renders rows, accept, mask and inputMode', async () => {
    const onSubmit = vi.fn();
    const definition: FormDefinition = {
      id: 'shapes',
      title: '',
      submit: { label: 'Send' },
      fields: [
        { key: 'cv', type: 'file', label: 'CV', accept: '.pdf' },
        {
          key: 'tags',
          type: 'multiselect',
          label: 'Tags',
          options: [
            { value: 'a', label: 'A' },
            { value: 'b', label: 'B' },
          ],
        },
        { key: 'ok', type: 'switch', label: 'OK' },
        { key: 'age', type: 'number', label: 'Age' },
        { key: 'bio', type: 'textarea', label: 'Bio', rows: 7 },
        { key: 'phone', type: 'phone', label: 'Phone', mask: '+1 (___) ___-____', inputMode: 'tel' },
      ],
    };
    render(<FormRenderer definition={definition} onSubmit={onSubmit} />);
    const file = new File(['x'], 'cv.pdf');
    fireEvent.change(screen.getByLabelText('CV'), { target: { files: [file] } });
    fireEvent.click(screen.getByLabelText('B'));
    fireEvent.click(screen.getByLabelText('OK'));
    fireEvent.change(screen.getByLabelText('Age'), { target: { value: '42' } });
    expect(screen.getByLabelText('CV').getAttribute('accept')).toBe('.pdf');
    expect(screen.getByLabelText('Bio').getAttribute('rows')).toBe('7');
    expect(screen.getByLabelText('Phone').getAttribute('placeholder')).toBe('+1 (___) ___-____');
    expect(screen.getByLabelText('Phone').getAttribute('inputmode')).toBe('tel');
    fireEvent.click(screen.getByRole('button', { name: 'Send' }));
    await waitFor(() => expect(onSubmit).toHaveBeenCalled());
    expect(onSubmit.mock.calls[0][0]).toEqual({ cv: file, tags: ['b'], ok: true, age: 42 });
  });

  it('shows the default of a field on a step that starts hidden', async () => {
    const onSubmit = vi.fn();
    render(<FormRenderer definition={rsvp} onSubmit={onSubmit} />);
    fireEvent.click(screen.getByLabelText('Yes'));
    fireEvent.click(screen.getByRole('button', { name: 'Continue' }));
    expect(((await screen.findByRole('spinbutton', { name: /Party size/ })) as HTMLInputElement).value).toBe('1');
    fireEvent.click(screen.getByRole('button', { name: 'Send RSVP' }));
    await waitFor(() => expect(onSubmit).toHaveBeenCalled());
    expect(onSubmit.mock.calls[0][0]).toEqual({ attending: 'yes', partySize: 1 });
  });

  it('submits cleared text as an empty string, a cleared number as null and an unchecked box as false', async () => {
    const onSubmit = vi.fn();
    render(<FormRenderer definition={blanks} initialValues={{ name: 'Ada', age: 3, ok: true }} onSubmit={onSubmit} />);
    fireEvent.change(screen.getByLabelText('Name'), { target: { value: '' } });
    fireEvent.change(screen.getByLabelText('Age'), { target: { value: '' } });
    fireEvent.click(screen.getByLabelText('OK'));
    fireEvent.click(screen.getByRole('button', { name: 'Save' }));
    await waitFor(() => expect(onSubmit).toHaveBeenCalled());
    expect(onSubmit.mock.calls[0][0]).toEqual({ name: '', age: null, ok: false });
  });
});

import type { FormDefinition, FormField } from '@formhaus/core';
import { fireEvent, render, screen } from '@testing-library/vue';
import { describe, expect, it } from 'vitest';
import FormRenderer from '../src/FormRenderer.vue';

const nps: FormField = {
  key: 'nps',
  type: 'scale',
  label: 'Recommend',
  helperText: 'Pick one',
  validation: { min: 0, max: 10 },
  options: [
    { value: '0', label: 'Not at all likely' },
    { value: '10', label: 'Extremely likely' },
  ],
};

const single = (...fields: FormField[]): FormDefinition => ({
  formatVersion: '1.3',
  id: 'f',
  title: 'F',
  submit: { label: 'Send' },
  fields,
});

const steps = (field: FormField): FormDefinition => ({
  formatVersion: '1.3',
  id: 's',
  title: 'S',
  submit: { label: 'Send' },
  steps: [
    { id: 'one', title: 'One', fields: [field] },
    { id: 'two', title: 'Two', fields: [{ key: 'after', type: 'text', label: 'After' }] },
  ],
});

const radio = (name: string, value: number) => document.querySelector<HTMLInputElement>(`input[name="${name}"][value="${value}"]`)!;

describe('ScaleField', async () => {
  it('renders a fieldset of native radios with a number label per point', async () => {
    render(FormRenderer, { props: { definition: single(nps), onSubmit: () => {} } });
    const group = screen.getByRole('group', { name: 'Recommend' });
    expect(group.tagName).toBe('FIELDSET');
    expect(group.className).toBe('fh-field fh-field--scale');
    expect(screen.getAllByRole('radio').map((input) => input.getAttribute('value'))).toEqual([
      '0',
      '1',
      '2',
      '3',
      '4',
      '5',
      '6',
      '7',
      '8',
      '9',
      '10',
    ]);
    expect(screen.getByLabelText('7')).toBe(radio('nps', 7));
    expect(group.getAttribute('aria-describedby')).toBe(`${radio('nps', 0).id.replace(/-0$/, '')}-helper`);
  });

  it('places anchors by role and skips labels on other points', async () => {
    const options = ['1', '2', '5'].map((value) => ({ value, label: `Label ${value}` }));
    render(FormRenderer, { props: { definition: single({ key: 'end', type: 'scale', label: 'End', options }), onSubmit: () => {} } });
    const spans = [...document.querySelectorAll('.fh-field__scale-anchor')].map((span) => span.textContent);
    expect(spans).toEqual(['Label 1', '', 'Label 5']);
    expect(radio('end', 2).hasAttribute('aria-describedby')).toBe(false);
  });

  it('links each anchor from its point with aria-describedby', async () => {
    render(FormRenderer, { props: { definition: single(nps), onSubmit: () => {} } });
    const first = radio('nps', 0).getAttribute('aria-describedby')!;
    const last = radio('nps', 10).getAttribute('aria-describedby')!;
    expect(document.getElementById(first)?.textContent).toBe('Not at all likely');
    expect(document.getElementById(last)?.textContent).toBe('Extremely likely');
    expect(radio('nps', 5).hasAttribute('aria-describedby')).toBe(false);
  });

  it('defaults to 1 to 5 and keeps the rating number as the label', async () => {
    render(FormRenderer, { props: { definition: single({ key: 'stars', type: 'rating', label: 'Stars' }), onSubmit: () => {} } });
    expect(screen.getByRole('group', { name: 'Stars' }).className).toBe('fh-field fh-field--rating');
    expect(screen.getAllByRole('radio')).toHaveLength(5);
    expect(screen.getByLabelText('5')).toBe(radio('stars', 5));
  });

  it('selects a point on click and submits a number', async () => {
    let submitted: Record<string, unknown> = {};
    render(FormRenderer, { props: { definition: single(nps), onSubmit: (values) => void (submitted = values) } });
    await fireEvent.click(radio('nps', 0));
    expect(radio('nps', 0).checked).toBe(true);
    await fireEvent.click(screen.getByRole('button', { name: 'Send' }));
    await screen.findByRole('button', { name: 'Send' });
    await new Promise((done) => setTimeout(done, 0));
    expect(submitted).toEqual({ nps: 0 });
  });

  it('selects the matching point with a digit key and moves focus to it', async () => {
    render(FormRenderer, { props: { definition: single(nps), onSubmit: () => {} } });
    radio('nps', 2).focus();
    await fireEvent.keyDown(radio('nps', 2), { key: '7' });
    expect(radio('nps', 7).checked).toBe(true);
    expect(document.activeElement).toBe(radio('nps', 7));
  });

  it('maps 0 to 10 on a 1 to 10 range and ignores digits out of range', async () => {
    render(FormRenderer, {
      props: {
        definition: single(
          { key: 'ten', type: 'rating', label: 'Ten', validation: { max: 10 } },
          { key: 'five', type: 'scale', label: 'Five' },
        ),
        onSubmit: () => {},
      },
    });
    await fireEvent.keyDown(radio('ten', 1), { key: '0' });
    expect(radio('ten', 10).checked).toBe(true);
    await fireEvent.keyDown(radio('five', 1), { key: '9' });
    await fireEvent.keyDown(radio('five', 1), { key: '0' });
    expect(document.querySelectorAll('input[name="five"]:checked')).toHaveLength(0);
  });

  it('ignores digit keys with a modifier, during composition and on repeat', async () => {
    render(FormRenderer, { props: { definition: single(nps), onSubmit: () => {} } });
    for (const init of [{ ctrlKey: true }, { metaKey: true }, { altKey: true }, { isComposing: true }, { repeat: true }])
      await fireEvent.keyDown(radio('nps', 2), { key: '7', ...init });
    expect(document.querySelectorAll('input[name="nps"]:checked')).toHaveLength(0);
  });

  it('commits on click with autoAdvance', async () => {
    render(FormRenderer, { props: { definition: steps({ ...nps, autoAdvance: true }), onSubmit: () => {} } });
    await fireEvent.click(radio('nps', 9), { detail: 1 });
    expect(await screen.findByLabelText('After')).toBeDefined();
  });

  it('commits on a digit key with autoAdvance', async () => {
    render(FormRenderer, {
      props: { definition: steps({ key: 'stars', type: 'rating', label: 'Stars', autoAdvance: true }), onSubmit: () => {} },
    });
    await fireEvent.keyDown(radio('stars', 1), { key: '4' });
    expect(await screen.findByLabelText('After')).toBeDefined();
  });

  it('only selects on arrow keys with autoAdvance', async () => {
    render(FormRenderer, { props: { definition: steps({ ...nps, autoAdvance: true }), onSubmit: () => {} } });
    await fireEvent.keyDown(radio('nps', 3), { key: 'ArrowRight' });
    await fireEvent.click(radio('nps', 4), { detail: 0 });
    await fireEvent.keyUp(radio('nps', 4), { key: 'ArrowRight' });
    await new Promise((done) => setTimeout(done, 0));
    expect(radio('nps', 4).checked).toBe(true);
    expect(screen.queryByLabelText('After')).toBeNull();
  });
});

describe('picture options', async () => {
  it('renders a decorative image inside each option and keeps the label', async () => {
    render(FormRenderer, {
      props: {
        definition: single(
          { key: 'room', type: 'radio', label: 'Room', options: [{ value: 'sea', label: 'Sea', image: 'https://example.com/sea.jpg' }] },
          {
            key: 'extras',
            type: 'multiselect',
            label: 'Extras',
            options: [
              { value: 'spa', label: 'Spa', image: 'https://example.com/spa.jpg' },
              { value: 'gym', label: 'Gym' },
            ],
          },
        ),
        onSubmit: () => {},
      },
    });
    const images = document.querySelectorAll('img.fh-field__option-image');
    expect(images).toHaveLength(2);
    expect([...images].map((image) => [image.getAttribute('alt'), image.getAttribute('loading'), image.getAttribute('decoding')])).toEqual([
      ['', 'lazy', 'async'],
      ['', 'lazy', 'async'],
    ]);
    expect(images[0].parentElement!.className).toBe('fh-field__radio-option');
    expect(screen.getByRole('radio', { name: 'Sea' }).getAttribute('type')).toBe('radio');
    expect(screen.getByLabelText('Gym').parentElement!.querySelector('img')).toBeNull();
  });
});

describe('matrix section', async () => {
  const agree = [
    { value: '1', label: 'Disagree' },
    { value: '2', label: 'Agree' },
  ];

  it('renders a column header from the first row and one radio group per row', async () => {
    render(FormRenderer, {
      props: {
        definition: single({
          key: 'pulse',
          type: 'section',
          layout: 'matrix',
          title: 'Pulse',
          fields: [
            { key: 'clear', type: 'radio', label: 'Clear', options: agree },
            { key: 'heard', type: 'radio', label: 'Heard', options: agree },
          ],
        } as unknown as FormField),
        onSubmit: () => {},
      },
    });
    const section = screen.getByRole('group', { name: 'Pulse' });
    expect(section.className).toBe('fh-section fh-section--matrix');
    expect(section.style.getPropertyValue('--fh-matrix-columns')).toBe('2');
    const header = section.querySelector('.fh-section__matrix-header')!;
    expect(header.getAttribute('aria-hidden')).toBe('true');
    expect(header.textContent).toBe('DisagreeAgree');
    expect(screen.getByRole('group', { name: 'Heard' }).querySelectorAll('input[type="radio"]')).toHaveLength(2);
    await fireEvent.click(screen.getAllByLabelText('Agree')[1]);
    expect(radio('heard', 2).checked).toBe(true);
  });

  it('keeps each row a group named by its label with the error inside the row', async () => {
    render(FormRenderer, {
      props: {
        definition: single({
          key: 'pulse',
          type: 'section',
          layout: 'matrix',
          title: 'Pulse',
          fields: [
            { key: 'clear', type: 'radio', label: 'Clear', options: agree, validation: { required: true } },
            { key: 'heard', type: 'radio', label: 'Heard', options: agree, validation: { required: true } },
          ],
        } as unknown as FormField),
        onSubmit: () => {},
      },
    });
    await fireEvent.click(screen.getAllByRole('radio', { name: 'Agree' })[0]!);
    await fireEvent.click(screen.getByRole('button', { name: 'Send' }));
    const heard = screen.getByRole('group', { name: 'Heard' });
    const error = await screen.findByRole('alert');
    expect(error.parentElement).toBe(heard);
    expect(heard.getAttribute('aria-describedby')).toBe(error.id);
    expect(screen.getByRole('group', { name: 'Clear' }).getAttribute('aria-invalid')).toBeNull();
    expect(screen.getAllByRole('radio', { name: 'Disagree' })).toHaveLength(2);
  });

  it('renders a plain section without layout', async () => {
    render(FormRenderer, {
      props: {
        definition: single({ key: 'note', type: 'section', title: 'Note', fields: [] } as unknown as FormField),
        onSubmit: () => {},
      },
    });
    const section = screen.getByRole('group', { name: 'Note' });
    expect(section.className).toBe('fh-section');
    const body = section.querySelector('.fh-section__body')!;
    expect([body.children.length, body.textContent]).toEqual([0, '']);
  });
});

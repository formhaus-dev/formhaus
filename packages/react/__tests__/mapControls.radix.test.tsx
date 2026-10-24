import type { FormDefinition } from '@formhaus/core';
import * as RadioGroup from '@radix-ui/react-radio-group';
import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { type ControlShellProps, mapControls } from '../src/controls';
import { FormRenderer } from '../src/FormRenderer';

globalThis.ResizeObserver ??= class {
  observe() {}
  unobserve() {}
  disconnect() {}
};

function Shell({ f, rootProps, children }: ControlShellProps) {
  return (
    <fieldset {...rootProps}>
      <legend>{f.label}</legend>
      {children}
    </fieldset>
  );
}

const components = mapControls({
  shell: Shell,
  controls: {
    radio: [
      RadioGroup.Root,
      (_, options) => ({
        children: options.map((option) => <RadioGroup.Item key={option.value} value={String(option.value)} aria-label={option.label} />),
      }),
      'onValueChange',
    ],
  },
});

const definition: FormDefinition = {
  id: 'radix',
  title: '',
  submit: { label: 'Send' },
  steps: [
    {
      id: 'one',
      title: 'One',
      fields: [
        {
          key: 'plan',
          type: 'radio',
          label: 'Plan',
          autoAdvance: true,
          options: ['a', 'b', 'c'].map((value) => ({ value, label: `Plan ${value}` })),
        },
      ],
    },
    { id: 'two', title: 'Two', fields: [{ key: 'city', type: 'text', label: 'City' }] },
  ],
};

const tick = () => new Promise((done) => setTimeout(done, 20));
const radio = (name: string) => screen.getByRole('radio', { name });

function mount(initialValues?: Record<string, unknown>) {
  const onFieldChange = vi.fn();
  render(
    <FormRenderer
      definition={definition}
      components={components}
      initialValues={initialValues}
      onSubmit={() => {}}
      onFieldChange={onFieldChange}
    />,
  );
  return () => onFieldChange.mock.calls.map(([, value]) => value);
}

describe('mapControls with Radix RadioGroup', () => {
  it('commits a click through onValueChange', async () => {
    const values = mount();
    fireEvent.pointerDown(radio('Plan b'));
    fireEvent.click(radio('Plan b'));
    await screen.findByRole('heading', { name: 'Two' });
    expect(values()).toEqual(['b']);
  });

  it('only changes on arrow focus, then commits Enter once', async () => {
    const values = mount();
    radio('Plan a').focus();
    fireEvent.keyDown(radio('Plan a'), { key: 'ArrowDown' });
    await tick();
    fireEvent.keyUp(document.activeElement!, { key: 'ArrowDown' });
    await tick();
    expect([values(), radio('Plan b').getAttribute('aria-checked'), screen.queryByRole('heading', { name: 'Two' })]).toEqual([
      ['b'],
      'true',
      null,
    ]);
    const picked = radio('Plan b');
    fireEvent.keyDown(picked, { key: 'Enter' });
    fireEvent.keyUp(picked, { key: 'Enter' });
    await screen.findByRole('heading', { name: 'Two' });
    expect(values()).toEqual(['b', 'b']);
  });

  it('moves focus on Home and End without a commit', async () => {
    const values = mount();
    radio('Plan b').focus();
    fireEvent.keyDown(radio('Plan b'), { key: 'End' });
    await tick();
    fireEvent.keyUp(document.activeElement!, { key: 'End' });
    fireEvent.keyDown(radio('Plan c'), { key: 'Home' });
    await tick();
    fireEvent.keyUp(document.activeElement!, { key: 'Home' });
    await tick();
    expect([values(), document.activeElement, screen.queryByRole('heading', { name: 'Two' })]).toEqual([[], radio('Plan a'), null]);
  });

  it('commits Space on the picked option once', async () => {
    const values = mount({ plan: 'c' });
    radio('Plan c').focus();
    fireEvent.keyDown(radio('Plan c'), { key: ' ' });
    fireEvent.keyUp(radio('Plan c'), { key: ' ' });
    await screen.findByRole('heading', { name: 'Two' });
    expect(values()).toEqual(['c']);
  });
});

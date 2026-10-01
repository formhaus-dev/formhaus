import { fireEvent, render, screen } from '@testing-library/vue';
import type { FormDefinition, FormField } from '@formhaus/core';
import { describe, expect, it } from 'vitest';
import { defineComponent, h, type PropType } from 'vue';
import FormRenderer from '../src/FormRenderer.vue';
import HeadlessFormRenderer from '../src/HeadlessFormRenderer.vue';

const CustomText = defineComponent({
  props: {
    field: { type: Object as PropType<FormField>, required: true },
    value: { type: null, default: undefined },
  },
  emits: ['update:value', 'blur', 'focus'],
  setup(props, { emit }) {
    return () => h('input', {
      'data-testid': `custom-${props.field.key}`,
      value: props.value ?? '',
      onInput: (e: Event) => emit('update:value', (e.target as HTMLInputElement).value),
    });
  },
});

const CustomActions = defineComponent({
  inheritAttrs: false,
  props: { primaryLabel: String },
  emits: ['primary', 'cancel'],
  setup(props, { emit }) {
    return () => h('div', [
      h('button', { type: 'button', onClick: () => emit('primary') }, props.primaryLabel),
      h('button', { type: 'button', onClick: () => emit('cancel') }, 'Custom cancel'),
    ]);
  },
});

const CustomProgress = defineComponent({
  inheritAttrs: false,
  props: { current: Number, total: Number },
  setup(props) {
    return () => h('p', { 'data-testid': 'custom-progress' }, `${props.current}/${props.total}`);
  },
});

const definition: FormDefinition = {
  id: 'headless',
  title: 'Headless',
  submit: { label: 'Send' },
  cancel: { label: 'Cancel' },
  fields: [
    { key: 'name', type: 'text', label: 'Name' },
    { key: 'email', type: 'email', label: 'Email' },
  ],
};

const steps: FormDefinition = {
  id: 'headless-steps',
  title: 'Steps',
  submit: { label: 'Send' },
  steps: [
    { id: 'one', title: 'One', fields: [{ key: 'name', type: 'text', label: 'Name' }] },
    { id: 'two', title: 'Two', fields: [{ key: 'city', type: 'text', label: 'City' }] },
  ],
};

describe('HeadlessFormRenderer', () => {
  it('renders mapped custom fields', () => {
    const { container } = render(HeadlessFormRenderer, {
      props: { definition, components: { text: CustomText, email: CustomText } },
    });
    expect(screen.getByTestId('custom-name')).toBeDefined();
    expect(screen.getByTestId('custom-email')).toBeDefined();
    expect(container.querySelector('.fh-field__input')).toBeNull();
  });

  it('renders the unsupported fallback for an unmapped type', () => {
    const { container } = render(HeadlessFormRenderer, {
      props: { definition, components: { text: CustomText } },
    });
    expect(screen.getByText('Unsupported field type: email')).toBeDefined();
    expect(container.querySelectorAll('input')).toHaveLength(1);
    expect(container.querySelector('.fh-field__input')).toBeNull();
  });

  it('renders no actions or progress when none are passed', () => {
    const { container } = render(HeadlessFormRenderer, {
      props: { definition: steps, components: { text: CustomText } },
    });
    expect(container.querySelector('button')).toBeNull();
    expect(container.querySelector('.fh-step-progress')).toBeNull();
  });

  it('renders the custom actions and progress when passed', async () => {
    const { emitted } = render(HeadlessFormRenderer, {
      props: {
        definition: steps,
        components: { text: CustomText },
        actionsComponent: CustomActions,
        progressComponent: CustomProgress,
      },
    });
    expect(screen.getByTestId('custom-progress').textContent).toBe('1/2');
    await fireEvent.click(screen.getByText('Continue'));
    expect(await screen.findByTestId('custom-city')).toBeDefined();
    expect(screen.getByTestId('custom-progress').textContent).toBe('2/2');
    expect(emitted().stepChange).toEqual([['two', 'next']]);
  });
});

describe('FormRenderer built-in fallbacks', () => {
  it('falls back to native fields, actions and progress', () => {
    const { container } = render(FormRenderer, {
      props: { definition: steps, components: { text: undefined } },
    });
    expect(container.querySelector('.fh-field__input')).not.toBeNull();
    expect(container.querySelector('.fh-step-progress')).not.toBeNull();
    expect(screen.getByRole('button', { name: 'Continue' })).toBeDefined();
  });

  it('mixes custom and native fields', () => {
    render(FormRenderer, { props: { definition, components: { text: CustomText } } });
    expect(screen.getByTestId('custom-name')).toBeDefined();
    expect(screen.getByRole('textbox', { name: 'Email' })).toBeDefined();
    expect(screen.queryByText(/Unsupported field type/)).toBeNull();
  });

  it('forwards every event from the headless core', async () => {
    const { emitted } = render(FormRenderer, {
      props: { definition, components: { text: CustomText }, actionsComponent: CustomActions },
    });
    await fireEvent.update(screen.getByTestId('custom-name'), 'Ann');
    await fireEvent.click(screen.getByText('Send'));
    await fireEvent.click(screen.getByText('Custom cancel'));

    expect(emitted().fieldChange[0]).toEqual(['name', 'Ann', { name: 'Ann' }]);
    expect(emitted().submit).toEqual([[{ name: 'Ann' }]]);
    expect(emitted().cancel).toHaveLength(1);
    expect(emitted().analyticsEvent).toContainEqual([{ type: 'form_submitted', fieldCount: 1 }]);
  });
});

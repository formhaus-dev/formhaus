import { fireEvent, render, screen } from '@testing-library/vue';
import { describe, expect, it, vi } from 'vitest';
import { defineComponent, h } from 'vue';
import type { FormDefinition, TestIdTarget } from '@formhaus/core';
import FormRenderer from '../src/FormRenderer.vue';
import { fieldComponentProps } from '../src/props';

const definition: FormDefinition = {
  id: 'signup',
  title: 'Sign up',
  submit: { label: 'Send' },
  steps: [
    {
      id: 'about',
      title: 'About',
      fields: [
        { key: 'email', type: 'email', label: 'Email', validation: { required: true } },
        {
          key: 'plan',
          type: 'radio',
          label: 'Plan',
          options: [
            { value: 'free', label: 'Free' },
            { value: 'pro', label: 'Pro' },
          ],
        },
        { key: 'nps', type: 'scale', label: 'Score', min: 1, max: 3 },
        { key: 'source', type: 'hidden', label: 'Source', defaultValue: 'ad' },
        { key: 'people', type: 'group', label: 'People', defaultItems: 1, fields: [{ key: 'name', type: 'text', label: 'Name' }] },
      ],
    },
    { id: 'done', title: 'Done', fields: [{ key: 'note', type: 'text', label: 'Note' }] },
  ],
};

describe('FormRenderer testIds', () => {
  it('adds no test ids by default', () => {
    const { container } = render(FormRenderer, { props: { definition, onSubmit: () => {} } });
    expect(container.querySelector('[data-testid]')).toBeNull();
  });

  it('names controls, options, group item fields and actions', async () => {
    render(FormRenderer, { props: { definition, testIds: true, onSubmit: () => {} } });
    expect(screen.getByTestId('signup.form').tagName).toBe('FORM');
    expect(screen.getByTestId('signup.email')).toBe(screen.getByRole('textbox', { name: /Email/ }));
    expect(screen.getByTestId('signup.plan').tagName).toBe('FIELDSET');
    expect(screen.getByTestId('signup.plan.pro')).toBe(screen.getByRole('radio', { name: 'Pro' }));
    expect(screen.getByTestId('signup.nps.2')).toBe(screen.getByRole('radio', { name: '2' }));
    expect(screen.getByTestId('signup.source')).toHaveProperty('type', 'hidden');
    expect(screen.getByTestId('signup.people.0.name')).toBe(screen.getByRole('textbox', { name: 'Name' }));
    await fireEvent.click(screen.getByTestId('signup.next'));
    expect(await screen.findByTestId('signup.summary')).toHaveProperty('role', 'alert');
    await fireEvent.update(screen.getByTestId('signup.email'), 'a@b.co');
    await fireEvent.click(screen.getByTestId('signup.next'));
    expect(await screen.findByTestId('signup.submit')).toHaveProperty('type', 'submit');
    expect(screen.getByTestId('signup.back')).toHaveProperty('type', 'button');
  });

  it('takes ids from a function and passes them to custom components', () => {
    const name = vi.fn((target: TestIdTarget) =>
      target.kind === 'option' ? `${target.key}-${target.value}` : target.kind === 'field' ? `f:${target.key}` : target.kind,
    );
    const Custom = defineComponent({
      props: fieldComponentProps,
      setup: (props) => () => h('span', { 'data-testid': props.testId }, props.optionTestId?.('x')),
    });
    render(FormRenderer, { props: { definition, testIds: name, components: { email: Custom }, onSubmit: () => {} } });
    expect(screen.getByTestId('f:email').textContent).toBe('email-x');
    expect(name).toHaveBeenCalledWith(expect.objectContaining({ kind: 'field', definitionId: 'signup', key: 'people.0.name' }));
    expect(screen.getByTestId('form').tagName).toBe('FORM');
  });
});

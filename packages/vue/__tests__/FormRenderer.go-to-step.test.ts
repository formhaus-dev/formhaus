import { render, screen } from '@testing-library/vue';
import type { FormDefinition } from '@formhaus/core';
import { expect, it } from 'vitest';
import { defineComponent, h, nextTick, ref } from 'vue';
import FormRenderer from '../src/FormRenderer.vue';
import HeadlessFormRenderer from '../src/HeadlessFormRenderer.vue';
import TextField from '../src/fields/TextField.vue';
import type { FormRendererHandle } from '../src/types';

const definition: FormDefinition = {
  id: 'route',
  title: '',
  submit: { label: 'Send' },
  steps: [
    { id: 'account', title: 'Account', fields: [{ key: 'email', type: 'text', label: 'Email', validation: { required: true } }] },
    { id: 'profile', title: 'Profile', fields: [{ key: 'name', type: 'text', label: 'Name' }] },
  ],
};

it.each([
  ['FormRenderer', FormRenderer],
  ['HeadlessFormRenderer', HeadlessFormRenderer],
])('%s handle opens a reachable step and reports a blocked one', async (_name, Renderer) => {
  const form = ref<FormRendererHandle>();
  const events: unknown[] = [];
  render(
    defineComponent({
      setup: () => () =>
        h(Renderer, {
          ref: form,
          definition,
          components: { text: TextField },
          onFormEvent: (event: unknown) => events.push(event),
        }),
    }),
  );
  expect(form.value!.goToStep('profile')).toEqual({ stepId: 'account', reached: false, reason: 'blocked' });
  expect(events).toContainEqual({ type: 'step_redirected', requestedStepId: 'profile', stepId: 'account', reason: 'blocked' });
  form.value!.setValue('email', 'ada@example.com');
  expect(form.value!.goToStep('profile')).toEqual({ stepId: 'profile', reached: true });
  await nextTick();
  expect(await screen.findByLabelText(/Name/)).toBeDefined();
});

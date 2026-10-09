import { fireEvent, render } from '@testing-library/vue';
import type { FormDefinition } from '@formhaus/core';
import { expect, it } from 'vitest';
import FormRenderer from '../src/FormRenderer.vue';

const definition: FormDefinition = { id: 'blur', title: '', submit: { label: 'Send' }, fields: [
  { key: 'agree', type: 'checkbox', label: 'Agree' },
  { key: 'alerts', type: 'switch', label: 'Alerts' },
  { key: 'plan', type: 'select', label: 'Plan', options: [{ value: 'a', label: 'A' }] },
  { key: 'resume', type: 'file', label: 'Resume' },
] };

it.each(['agree', 'alerts', 'plan', 'resume'])('reports field_blurred for %s', async (key) => {
  const { container, emitted } = render(FormRenderer, { props: { definition } });
  const control = container.querySelector(`#fh-field-${key}`)!;
  await fireEvent.focus(control);
  await fireEvent.blur(control);
  const events = (emitted().analyticsEvent ?? []).map(([event]) => event as { type: string; fieldKey?: string });
  expect(events).toContainEqual(expect.objectContaining({ type: 'field_blurred', fieldKey: key }));
});

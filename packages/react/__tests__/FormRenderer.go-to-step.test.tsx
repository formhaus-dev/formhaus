import { act, render, screen, waitFor } from '@testing-library/react';
import type { FormDefinition } from '@formhaus/core';
import { createRef } from 'react';
import { expect, it, vi } from 'vitest';
import { FormRenderer, type FormRendererHandle, HeadlessFormRenderer, useFormEngine } from '../src';

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
  const handle = createRef<FormRendererHandle>();
  const onFormEvent = vi.fn();
  render(<Renderer ref={handle} definition={definition} onSubmit={() => {}} onFormEvent={onFormEvent} />);
  let result: unknown;
  act(() => {
    result = handle.current!.goToStep('profile');
  });
  expect(result).toEqual({ stepId: 'account', reached: false, reason: 'blocked' });
  expect(onFormEvent).toHaveBeenCalledWith({ type: 'step_redirected', requestedStepId: 'profile', stepId: 'account', reason: 'blocked' });
  expect(screen.queryByText('This field is required')).toBeNull();
  act(() => handle.current!.setValue('email', 'ada@example.com'));
  act(() => {
    result = handle.current!.goToStep('profile');
  });
  expect(result).toEqual({ stepId: 'profile', reached: true });
  await waitFor(() => expect(onFormEvent).toHaveBeenCalledWith({ type: 'step_viewed', stepId: 'profile', stepIndex: 1 }));
});

it('exposes goToStep on the engine of useFormEngine', () => {
  let engine: ReturnType<typeof useFormEngine> | undefined;
  function Probe() {
    engine = useFormEngine(definition);
    return <p>{engine.currentStep?.id}</p>;
  }
  render(<Probe />);
  let result: unknown;
  act(() => {
    result = engine!.goToStep('missing');
  });
  expect(result).toEqual({ stepId: 'account', reached: false, reason: 'unknown-step' });
});

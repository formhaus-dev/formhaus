import { fireEvent, render, screen } from '@testing-library/vue';
import type { FormDefinition } from '@formhaus/core';
import { afterEach, describe, expect, it, vi } from 'vitest';
import FormRenderer from '../src/FormRenderer.vue';

const definition: FormDefinition = {
  id: 'reset',
  title: '',
  submit: { label: 'Send' },
  fields: [{ key: 'name', type: 'text', label: 'Name' }],
};

const input = () => screen.getByLabelText('Name') as HTMLInputElement;
const formhausWarnings = (warn: { mock: { calls: unknown[][] } }) =>
  warn.mock.calls.filter(([message]) => String(message).startsWith('[formhaus]'));

afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllEnvs();
});

describe('definition changes', () => {
  it('warns once when a new definition object has the same content, and resets the form', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const { rerender } = render(FormRenderer, { props: { definition, initialValues: { name: 'Ada' } } });
    await fireEvent.update(input(), 'Grace');
    await rerender({ definition: structuredClone(definition) });
    expect(input().value).toBe('Ada');
    await rerender({ definition: structuredClone(definition) });
    expect(formhausWarnings(warn)).toEqual([
      [
        '[formhaus] The form got a new definition object with the same content and was reset. Keep the definition in a constant or a computed.',
      ],
    ]);
  });

  it('resets without a warning when the definition content changes', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const { rerender } = render(FormRenderer, { props: { definition } });
    await fireEvent.update(input(), 'Grace');
    await rerender({ definition: { ...definition, fields: [{ key: 'name', type: 'text', label: 'Name', defaultValue: 'Lin' }] } });
    expect(input().value).toBe('Lin');
    expect(formhausWarnings(warn)).toEqual([]);
  });

  it('keeps the form when only initialValues change', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const { rerender } = render(FormRenderer, { props: { definition, initialValues: { name: 'Ada' } } });
    await fireEvent.update(input(), 'Grace');
    await rerender({ initialValues: { name: 'Lin' } });
    expect(input().value).toBe('Grace');
    expect(formhausWarnings(warn)).toEqual([]);
  });

  it('sends the warning to onWarning', async () => {
    const onWarning = vi.fn();
    const { rerender } = render(FormRenderer, { props: { definition, onWarning } });
    await rerender({ definition: { ...definition } });
    expect(onWarning.mock.calls.map(([issue]) => [issue.code, issue.severity, issue.hint])).toEqual([
      ['definition-reset', 'warning', 'Keep the definition in a constant or a computed.'],
    ]);
  });

  it('does not warn in production', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    vi.stubEnv('NODE_ENV', 'production');
    const { rerender } = render(FormRenderer, { props: { definition } });
    await rerender({ definition: { ...definition } });
    expect(formhausWarnings(warn)).toEqual([]);
  });
});

import { describe, expect, it } from 'vitest';
import { checkDefinition, FormDefinitionError, FormEngine } from '../../src';
import { checkTranslations, localize } from '../../src/i18n';
import { validateSubmission } from '../../src/server';

const base = () => ({
  id: 'signup',
  title: 'Sign up',
  submit: { label: 'Send' },
  fields: [{ key: 'email', type: 'email', label: 'Email', options: undefined as unknown, validation: { required: true } as Record<string, unknown> }],
});

const codes = (definition: unknown) => checkTranslations(definition as never).map(({ code, severity, path }) => ({ code, severity, path }));

describe('i18n definition checks', () => {
  it('accepts lang, catalogs and translation keys on every node', () => {
    const definition = {
      ...base(),
      lang: 'en',
      messages: { required: 'Required' },
      labels: { stepOf: '{current}/{total}' },
      i18n: { title: 'signup.title', messages: { required: 'errors.required' }, labels: { continue: 'common:next' } },
      submit: { label: 'Send', i18n: { label: 'signup.submit' } },
      fields: [{
        key: 'plan', type: 'radio', label: 'Plan', placeholder: 'Pick', i18n: { label: 'plan.label', placeholder: 'plan.placeholder' },
        options: [{ value: 'free', label: 'Free', i18n: { label: 'plans.free' } }],
        validation: { required: true, i18n: { required: 'errors.plan' } },
      }],
    };
    expect(codes(definition)).toEqual([]);
    expect(checkDefinition(definition)).toEqual([]);
    expect(() => new FormEngine(definition)).not.toThrow();
  });

  it('rejects malformed catalogs and keys', () => {
    const definition = {
      ...base(),
      lang: 5,
      messages: { required: '' },
      labels: 'Back',
      i18n: { title: 7, messages: { email: '' } },
      fields: [{ key: 'email', type: 'email', label: 'Email', i18n: [], validation: { i18n: { required: ' ' } } }],
    };
    expect(codes(definition).sort((a, b) => a.path.localeCompare(b.path))).toEqual([
      { code: 'invalid-type', severity: 'error', path: '/fields/0/i18n' },
      { code: 'invalid-type', severity: 'error', path: '/fields/0/validation/i18n/required' },
      { code: 'invalid-type', severity: 'error', path: '/i18n/messages/email' },
      { code: 'invalid-type', severity: 'error', path: '/i18n/title' },
      { code: 'invalid-type', severity: 'error', path: '/labels' },
      { code: 'invalid-type', severity: 'error', path: '/lang' },
      { code: 'invalid-type', severity: 'error', path: '/messages/required' },
    ]);
    expect(() => localize(definition as never, { overlay: {} })).toThrow(FormDefinitionError);
    expect(() => new FormEngine(definition as never)).not.toThrow();
  });

  it('rejects a key without its source text and leaves the engine and the server alone', () => {
    const definition = { ...base(), i18n: { description: 'signup.description' }, fields: [{ key: 'email', type: 'email', label: 'Email', i18n: { helperText: 'email.help' } }] };
    expect(codes(definition)).toEqual([
      { code: 'i18n-unbound-slot', severity: 'error', path: '/i18n/description' },
      { code: 'i18n-unbound-slot', severity: 'error', path: '/fields/0/i18n/helperText' },
    ]);
    expect(() => localize(definition as never, { translate: () => undefined })).toThrow(FormDefinitionError);
    expect(() => new FormEngine(definition as never)).not.toThrow();
    expect(validateSubmission(definition as never, {}).errors).toEqual({});
  });

  it('warns about unknown slots, catalog keys and rules without a key target', () => {
    const definition = {
      ...base(),
      messages: { requried: 'x' },
      i18n: { subtitle: 'x', labels: { next: 'common.next' } },
      fields: [{ key: 'email', type: 'email', label: 'Email', i18n: { hint: 'x' }, validation: { required: true, i18n: { minLength: 'x' } } }],
    };
    expect(codes(definition)).toEqual([
      { code: 'unknown-message-key', severity: 'warning', path: '/messages/requried' },
      { code: 'unknown-label-key', severity: 'warning', path: '/i18n/labels/next' },
      { code: 'unknown-i18n-slot', severity: 'warning', path: '/i18n/subtitle' },
      { code: 'unknown-i18n-slot', severity: 'warning', path: '/fields/0/i18n/hint' },
      { code: 'unknown-i18n-slot', severity: 'warning', path: '/fields/0/validation/i18n/minLength' },
    ]);
  });

  it('warns about dotted identifiers only when the definition has translation keys', () => {
    const definition = {
      ...base(),
      id: 'sign.up',
      fields: [{ key: 'a:b', type: 'radio', label: 'A', options: [{ value: '1.5', label: 'One and a half' }] }],
    };
    expect(codes(definition)).toEqual([]);
    expect(codes({ ...definition, i18n: { title: 'title' } })).toEqual([
      { code: 'i18n-unsafe-identifier', severity: 'warning', path: '/id' },
      { code: 'i18n-unsafe-identifier', severity: 'warning', path: '/fields/0/key' },
      { code: 'i18n-unsafe-identifier', severity: 'warning', path: '/fields/0/options/0/value' },
    ]);
  });
});

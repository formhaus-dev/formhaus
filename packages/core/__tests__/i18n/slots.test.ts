import { describe, expect, it } from 'vitest';
import { localize, textSlots, translationIssues, translationTemplate } from '../../src/i18n';
import { validateSubmission } from '../../src/server';
import type { FormDefinition } from '../../src/types';
import { ru, signup } from './fixtures';

describe('textSlots and translationTemplate', () => {
  it('lists every text a translator sees with its key, params and hash', () => {
    const slots = textSlots(signup);
    const byAddress = Object.fromEntries(slots.map((slot) => [slot.address, slot]));
    expect(byAddress.title).toMatchObject({ key: 'signup.title', text: 'Create your account', params: [] });
    expect(byAddress['steps.kind.fields.email.placeholder']).toMatchObject({
      key: 'signup.steps.kind.fields.email.placeholder',
      text: 'you@example.com',
    });
    expect(byAddress['steps.kind.fields.kind.options.business']).toMatchObject({ key: 'plans.business', text: 'Business' });
    expect(byAddress['steps.kind.fields.password.validation.minLength']).toMatchObject({
      key: 'errors.password.tooShort',
      text: 'At least 8 characters',
    });
    expect(byAddress['messages.minLength']).toMatchObject({
      key: 'signup.messages.minLength',
      text: 'Minimum length is {min}',
      params: ['min'],
    });
    expect(byAddress['labels.stepOf']).toMatchObject({ params: ['current', 'total'] });
    expect(byAddress['steps.home.fields.address.validation.minLength']).toBeUndefined();
    expect(byAddress['messages.boolean']).toBeUndefined();
    expect(slots.every(({ hash }) => /^[0-9a-f]{8}$/.test(hash))).toBe(true);
    expect(textSlots(signup, { prefix: false }).find(({ address }) => address === 'description')).toBeUndefined();
    expect(textSlots(signup, { prefix: false }).find(({ address }) => address === 'steps.kind.title')).not.toHaveProperty('key');
  });

  it('builds an overlay skeleton that round-trips to the source texts', () => {
    const template = translationTemplate(signup);
    expect(template.steps).toMatchObject({ business: { fields: { address: { label: 'Company address' } } } });
    const { messages, labels, ...localized } = localize(signup, { overlay: template }).definition;
    expect(localized).toEqual(signup);
    expect(messages).toEqual({
      required: 'This field is required',
      minLength: 'Minimum length is {min}',
      maxLength: 'Maximum length is {max}',
      email: 'Enter a valid email',
      option: 'Select one of the available options',
      string: 'Must be text',
    });
    expect(labels).toEqual({
      continue: 'Continue',
      back: 'Back',
      stepOf: 'Step {current} of {total}',
      errorSummary: 'Check these answers',
      required: 'required',
      stepErrors: 'Errors: {count}',
    });
    expect(translationIssues(signup, template)).toEqual({ missing: [], unknown: [], invalid: [], placeholderMismatch: [], unlabeled: [] });
  });

  it('asks for the messages of wrong-type answers so server errors are translated too', () => {
    const definition = {
      id: 'types',
      title: 'Types',
      submit: { label: 'Send' },
      fields: [
        { key: 'plan', type: 'select', label: 'Plan', options: [{ value: 'a', label: 'A' }] },
        { key: 'tags', type: 'multiselect', label: 'Tags', options: [{ value: 'a', label: 'A' }] },
        { key: 'agree', type: 'checkbox', label: 'Agree' },
        { key: 'name', type: 'text', label: 'Name' },
      ],
    } as FormDefinition;
    const template = translationTemplate(definition);
    expect(Object.keys(template.messages ?? {}).sort()).toEqual(['boolean', 'maxLength', 'option', 'options', 'string']);
    const overlay = { ...template, messages: Object.fromEntries(Object.keys(template.messages ?? {}).map((key) => [key, `ru:${key}`])) };
    expect(translationIssues(definition, overlay).missing).toEqual([]);
    const { definition: localized, messages } = localize(definition, { overlay });
    const { errors } = validateSubmission(localized, { plan: 'x', tags: 'a', agree: 'yes', name: 5 }, { messages });
    expect(errors).toEqual({ plan: 'ru:option', tags: 'ru:options', agree: 'ru:boolean', name: 'ru:string' });
  });
});

describe('picture preview labels', () => {
  it('lists enlargeImage and close only for forms with option images', () => {
    const form = (image?: string): FormDefinition => ({
      id: 'f',
      title: 'F',
      submit: { label: 'Send' },
      fields: [{ key: 'room', type: 'radio', label: 'Room', options: [{ value: 'sea', label: 'Sea', ...(image ? { image } : {}) }] }],
    });
    const labels = (definition: FormDefinition) =>
      textSlots(definition).filter(({ address }) => /^labels\.(enlargeImage|close)$/.test(address));
    expect(labels(form('https://example.com/sea.jpg')).map(({ address, text }) => [address, text])).toEqual([
      ['labels.enlargeImage', 'Enlarge image: {label}'],
      ['labels.close', 'Close'],
    ]);
    expect(labels(form())).toEqual([]);
  });
});

describe('translationIssues', () => {
  it('reports missing, unknown, invalid and placeholder problems', () => {
    const overlay = {
      ...ru,
      footer: 'x',
      labels: { stepOf: 'Шаг {current}', continue: 'Далее' },
      steps: { ...ru.steps, kind: { ...ru.steps.kind, description: 'нет', fields: { ...ru.steps.kind.fields, extra: { label: 5 } } } },
    };
    const issues = translationIssues(signup, overlay);
    expect(issues.unknown.sort()).toEqual(['footer', 'steps.kind.description']);
    expect(issues.invalid).toEqual(['steps.kind.fields.extra.label']);
    expect(issues.placeholderMismatch).toEqual(['labels.stepOf']);
    expect(issues.missing).toContain('steps.kind.fields.email.placeholder');
    expect(issues.missing).toContain('steps.kind.fields.kind.options.home');
    expect(issues.missing).not.toContain('steps.kind.fields.password.validation.minLength');
    expect(issues).not.toHaveProperty('stale');
  });

  it('accepts params of the rule in field messages', () => {
    const overlay = { fields: { age: { validation: { min: 'От {min}', max: 'До {limit}' } } } };
    const definition = {
      id: 'f',
      title: 'F',
      submit: { label: 'S' },
      fields: [{ key: 'age', type: 'number', label: 'Age', validation: { min: 18, max: 99 } }],
    };
    expect(translationIssues(definition, overlay).placeholderMismatch).toEqual(['fields.age.validation.max']);
  });

  it('reports stale translations against a baseline and unlabeled fields', () => {
    const baseline = Object.fromEntries(textSlots(signup).map(({ address, hash }) => [address, { hash }]));
    const changed = JSON.parse(JSON.stringify(signup));
    changed.title = 'Join us';
    changed.steps[1].fields[0].label = '';
    const issues = translationIssues(changed, ru, { slots: baseline });
    expect(issues.stale).toEqual(['title', 'steps.business.fields.address.label']);
    expect(translationIssues(changed, {}).unlabeled).toEqual(['steps.business.fields.address.label']);
    expect(translationIssues(changed, ru).unlabeled).toEqual([]);
    changed.steps[1].fields.push({ key: 'utm', type: 'hidden' });
    expect(translationIssues(changed, {}).unlabeled).toEqual(['steps.business.fields.address.label']);
    expect(translationIssues(signup, 'nope').invalid).toEqual(['']);
  });

  it('compares hashes with the prefix of the baseline and checks own placeholder names', () => {
    const baseline = Object.fromEntries(textSlots(signup, { prefix: 'app.forms' }).map(({ address, hash }) => [address, { hash }]));
    expect(translationIssues(signup, ru, { prefix: 'app.forms', slots: baseline }).stale).toEqual([]);
    const definition = {
      id: 'f',
      title: 'F',
      submit: { label: 'S' },
      fields: [{ key: 'age', type: 'number', label: 'Age', validation: { min: 18 } }],
    };
    expect(translationIssues(definition, { fields: { age: { validation: { min: 'От {constructor}' } } } }).placeholderMismatch).toEqual([
      'fields.age.validation.min',
    ]);
    expect(
      textSlots({ ...definition, fields: [{ ...definition.fields[0], validation: { min: 18, minMessage: 'Too young' } }] }).find(
        ({ address }) => address.endsWith('min'),
      )?.params,
    ).toEqual(['min']);
  });
});

describe('inactive required rules', () => {
  const definition = (required: false | '') =>
    ({
      id: 'f',
      title: 'F',
      submit: { label: 'S' },
      fields: [{ key: 'name', type: 'text', label: 'Name', validation: { required } }],
    }) as FormDefinition;

  it.each([false, ''] as const)('exports no slot and ignores a translation for required %j', (required) => {
    const source = definition(required);
    const overlay = { fields: { name: { validation: { required: 'Нужно' } } } };
    expect(translationTemplate(source).fields).toEqual({ name: { label: 'Name' } });
    expect(translationTemplate(source).messages).not.toHaveProperty('required');
    expect(textSlots(source).map(({ address }) => address)).not.toContain('fields.name.validation.required');
    expect(translationIssues(source, overlay).unknown).toEqual(['fields.name.validation.required']);
    expect(localize(source, { overlay }).definition.fields![0].validation).toEqual({ required });
    const translated = localize(source, { translate: () => 'Нужно' }).definition;
    expect(translated.fields![0].validation).toEqual({ required });
    expect(validateSubmission(translated, {}).errors).toEqual({});
  });
});

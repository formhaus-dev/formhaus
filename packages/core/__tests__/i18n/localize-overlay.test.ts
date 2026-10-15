import { describe, expect, it } from 'vitest';
import { FormEngine, type FormDefinition } from '../../src';
import { localize } from '../../src/i18n';
import { validateSubmission } from '../../src/server';
import { ru, signup } from './fixtures';

describe('localize with an overlay', () => {
  const { definition, messages, labels } = localize(signup, { overlay: ru, lang: 'ru' });
  const [kind, business, home] = definition.steps!;

  it('replaces static texts and keeps the source for missing or empty entries', () => {
    expect(definition.title).toBe('Создайте аккаунт');
    expect(definition.lang).toBe('ru');
    expect(definition.submit.label).toBe('Создать аккаунт');
    expect(kind.title).toBe('Аккаунт');
    expect(kind.fields[0]).toMatchObject({ label: 'Почта', placeholder: 'you@example.com' });
    expect(kind.fields[2].options).toEqual([
      { value: 'business', label: 'Бизнес', i18n: { label: 'plans.business' } },
      { value: 'home', label: 'Home' },
    ]);
    expect(business.title).toBe('Company');
  });

  it('gives the same key on exclusive branches its own text', () => {
    expect(business.fields[0].label).toBe('Адрес компании');
    expect(home.fields[0].label).toBe('Домашний адрес');
  });

  it('writes field messages as literals with static params', () => {
    expect(kind.fields[0].validation).toMatchObject({ required: 'Укажите почту' });
    expect(kind.fields[1].validation).toMatchObject({ required: true, minLengthMessage: 'Пароль: не менее 8 символов' });
  });

  it('merges messages and labels into the definition catalogs', () => {
    expect(definition.messages).toEqual(ru.messages);
    expect(messages).toBe(definition.messages);
    expect(labels).toEqual(ru.labels);
  });

  it('validates the same in the browser engine and on the server', () => {
    const values = { email: '', password: 'abc', kind: 'home', address: 'abc' };
    const engine = new FormEngine(definition, values);
    const expected = { email: 'Укажите почту', password: 'Пароль: не менее 8 символов', address: 'Минимум 5 символов' };
    expect(engine.validate()).toEqual(expected);
    expect(validateSubmission(definition, values).errors).toEqual(expected);
  });

  it('never enables a rule, creates nodes or mutates the source', () => {
    const source: FormDefinition = {
      id: 'f',
      title: 'F',
      submit: { label: 'S' },
      fields: [{ key: 'name', type: 'text', label: 'Name', validation: { required: false } }],
    };
    const before = JSON.stringify(source);
    const overlay = {
      fields: { name: { validation: { required: 'Нужно', pattern: 'Формат' }, helperText: 'Подсказка' }, ghost: { label: 'Призрак' } },
    };
    const result = localize(source, { overlay });
    expect(result.definition.fields).toEqual([{ key: 'name', type: 'text', label: 'Name', validation: { required: false } }]);
    expect(JSON.stringify(source)).toBe(before);
  });

  it('reads own properties only', () => {
    const source: FormDefinition = {
      id: 'f',
      title: 'F',
      submit: { label: 'S' },
      fields: [
        {
          key: 'pick',
          type: 'select',
          label: 'Pick',
          options: [
            { value: 'constructor', label: 'C' },
            { value: '__proto__', label: 'P' },
          ],
        },
      ],
    };
    const overlay = JSON.parse('{"fields":{"pick":{"options":{"__proto__":"П"}}}}');
    expect(localize(source, { overlay }).definition.fields![0].options).toEqual([
      { value: 'constructor', label: 'C' },
      { value: '__proto__', label: 'П' },
    ]);
    expect(localize(source, { overlay: {} }).definition.fields![0].options![0].label).toBe('C');
  });
});

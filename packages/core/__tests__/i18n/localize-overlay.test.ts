import { describe, expect, it } from 'vitest';
import type { FormDefinition } from '../../src';
import { localize, translation } from '../../src/i18n';
import { ru, signup } from './fixtures';

describe('localize with an overlay', () => {
  const { definition, messages, labels } = localize(signup, translation({ ...ru, locale: 'ru' }));
  const [kind, business] = definition.steps!;

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

  it('merges messages and labels into the definition catalogs', () => {
    expect(definition.messages).toEqual(ru.messages);
    expect(definition.labels).toEqual(ru.labels);
    expect(messages('required', {}, kind.fields[0])).toBe(ru.messages.required);
    expect(labels('continue', {})).toBe(ru.labels.continue);
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
    const result = localize(source, translation({ ...overlay, locale: 'ru' }));
    expect(result.definition.fields).toEqual([{ key: 'name', type: 'text', label: 'Name', validation: { required: false } }]);
    expect(JSON.stringify(source)).toBe(before);
  });
});

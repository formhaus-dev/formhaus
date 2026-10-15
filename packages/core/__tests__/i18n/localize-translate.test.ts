import { describe, expect, it } from 'vitest';
import { FormEngine } from '../../src';
import { localize, type TranslateFn } from '../../src/i18n';
import { labelFor } from '../../src/internal';
import { signup } from './fixtures';

const dictionary: Record<string, string> = {
  'signup.title': 'Создайте аккаунт',
  'signup.email.label': 'Почта',
  'errors.emailRequired': 'Укажите почту',
  'errors.password.tooShort': 'Не менее {{min}} символов',
  'plans.business': 'Бизнес',
  'signup.steps.home.fields.address.label': 'Домашний адрес',
  'errors.required': 'Обязательное поле',
  'signup.messages.minLength': 'Минимум {{min}}',
  'common.next': 'Далее',
  'signup.labels.stepOf': 'Шаг {{current}} из {{total}}',
};

const interpolate = (text: string, params: Record<string, unknown>) =>
  text.replace(/\{\{(\w+)\}\}/g, (_, name: string) => String(params[name]));

function i18next(): { t: TranslateFn; asked: string[] } {
  const asked: string[] = [];
  const t: TranslateFn = (key, params, defaultValue) => {
    asked.push(key);
    return key in dictionary ? interpolate(dictionary[key], params) : defaultValue;
  };
  return { t, asked };
}

describe('localize with a translate function', () => {
  it('uses explicit keys first and derived keys otherwise', () => {
    const { t, asked } = i18next();
    const { definition } = localize(signup, { translate: t });
    const [kind, business, home] = definition.steps!;
    expect(definition.title).toBe('Создайте аккаунт');
    expect(kind.fields[0].label).toBe('Почта');
    expect(kind.fields[0].validation?.required).toBe('Укажите почту');
    expect(kind.fields[1].validation?.minLengthMessage).toBe('Не менее 8 символов');
    expect(kind.fields[2].options![0].label).toBe('Бизнес');
    expect(home.fields[0].label).toBe('Домашний адрес');
    expect(business.fields[0].label).toBe('Company address');
    expect(asked).toContain('signup.steps.kind.fields.password.label');
    expect(asked).not.toContain('signup.steps.kind.fields.email.label');
  });

  it('never writes a fallback over a rule that has no literal', () => {
    const { t } = i18next();
    const { definition } = localize(signup, { translate: t });
    expect(definition.steps![0].fields[1].validation).toEqual(
      signup.steps![0].fields[1].validation && { ...signup.steps![0].fields[1].validation, minLengthMessage: 'Не менее 8 символов' },
    );
    expect(definition.steps![2].fields[0].validation).toEqual({ minLength: 5 });
  });

  it('resolves catalog messages and labels at runtime with params', () => {
    const { t } = i18next();
    const { definition, messages, labels } = localize(signup, { translate: t });
    const engine = new FormEngine(definition, { email: 'a@b.co', password: 'secret123', kind: 'home', address: 'abc' }, { messages });
    expect(engine.validate()).toEqual({ address: 'Минимум 5' });
    expect(new FormEngine(definition, {}, { messages }).validate().kind).toBe('Обязательное поле');
    expect(labelFor('stepOf', { current: 2, total: 3 }, labels, definition.labels)).toBe('Шаг 2 из 3');
    expect(labelFor('continue', {}, labels)).toBe('Далее');
    expect(labelFor('back', {}, labels)).toBe('Back');
  });

  it('treats undefined, empty and key-echo results as missing', () => {
    const echo: TranslateFn = (key) => key;
    const empty: TranslateFn = () => '';
    for (const translate of [echo, empty, () => undefined]) {
      const { definition, messages } = localize(signup, { translate });
      expect(definition).toEqual(signup);
      expect(typeof messages === 'function' && messages('required', {}, signup.steps![0].fields[0])).toBe(undefined);
    }
  });

  it('asks explicit keys only with prefix false and bare addresses with an empty prefix', () => {
    const { t, asked } = i18next();
    localize(signup, { translate: t, prefix: false });
    expect(asked.every((key) => !key.startsWith('signup.steps'))).toBe(true);
    const bare = i18next();
    localize(signup, { translate: bare.t, prefix: '' });
    expect(bare.asked).toContain('steps.kind.title');
  });

  it('fills {name} placeholders left in a result, such as an overlay loaded into i18next', () => {
    const raw: TranslateFn = (key, params, fallback) =>
      ({
        'signup.labels.stepOf': 'Шаг {current} из {total}',
        'signup.messages.minLength': 'Минимум {min}',
        'errors.password.tooShort': 'Не менее {min}',
      })[key] ?? fallback;
    const { definition, messages, labels } = localize(signup, { translate: raw });
    expect(labelFor('stepOf', { current: 1, total: 2 }, labels)).toBe('Шаг 1 из 2');
    expect(new FormEngine(definition, { kind: 'home', address: 'abc' }, { messages }).validate().address).toBe('Минимум 5');
    expect(definition.steps![0].fields[1].validation?.minLengthMessage).toBe('Не менее 8');
  });

  it('keeps the source text when the translate function throws', () => {
    const failing: TranslateFn = (key) => {
      if (key === 'signup.title') throw new Error('Invalid linked format');
      return undefined;
    };
    const { definition, messages } = localize(signup, {
      translate: (key, params, fallback) => (key === 'signup.email.label' ? 'Почта' : failing(key, params, fallback)),
    });
    expect(definition.title).toBe('Create your account');
    expect(definition.steps![0].fields[0].label).toBe('Почта');
    const throwing = localize(signup, {
      translate: () => {
        throw new Error('x');
      },
    });
    expect(typeof throwing.messages === 'function' && throwing.messages('required', {}, signup.steps![0].fields[0])).toBe(undefined);
    expect(messages).toBeTypeOf('function');
  });
});

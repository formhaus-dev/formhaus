import { describe, expect, it, vi } from 'vitest';
import { FormEngine, type FormEngineOptions, type LocaleCatalog, type LocaleSource } from '../../src';
import { localize, translationIssues } from '../../src/i18n';
import { definitionSource, engineLabel, refreshLocale } from '../../src/internal';
import { validateSubmission } from '../../src/server';
import { ru, signup } from './fixtures';

const generic: LocaleCatalog = {
  locale: 'ru',
  messages: { minLength: { one: 'Не менее {min} символа', few: 'Не менее {min} символов', many: 'Не менее {min} символов', other: 'x' } },
  labels: { back: 'Назад', stepOf: 'Общий шаг' },
};

const form: LocaleCatalog = { ...ru, locale: 'ru' };

describe('the locale option', () => {
  it('keeps the definition object when there is no locale', () => {
    const engine = new FormEngine(signup);
    expect(engine.definition).toBe(signup);
    expect(definitionSource(engine)).toBe(signup);
  });

  it('translates the form texts, messages and labels from one list of sources', () => {
    const engine = new FormEngine(signup, { kind: 'home', address: 'abc' }, { locale: [form, generic] });
    expect(definitionSource(engine)).toBe(signup);
    expect(engine.definition).toMatchObject({ lang: 'ru', title: 'Создайте аккаунт', submit: { label: 'Создать аккаунт' } });
    expect(engine.currentStep?.title).toBe('Аккаунт');
    expect(engine.visibleFields.map(({ label }) => label)).toEqual(['Почта', 'Пароль', 'Тариф']);
    expect(engineLabel(engine, 'stepOf', { current: 1, total: 2 })).toBe('Шаг 1 из 2');
    expect(engineLabel(engine, 'back', {})).toBe('Назад');
    expect(engine.validate()).toMatchObject({ email: 'Укажите почту', password: 'Обязательное поле' });
    expect(new FormEngine(signup, { kind: 'home', address: 'abc' }, { locale: [generic] }).validate().address).toBe('Не менее 5 символов');
  });

  it('asks the latest translate function for messages and labels', () => {
    const options: FormEngineOptions = { locale: { locale: 'de', translate: () => undefined } };
    const engine = new FormEngine(signup, {}, options);
    expect(engineLabel(engine, 'continue', {})).toBe('Continue');
    options.locale = { locale: 'de', translate: (key) => (key === 'common.next' ? 'Weiter' : undefined) };
    expect(engineLabel(engine, 'continue', {})).toBe('Weiter');
  });

  it('switches the texts on refresh and keeps the answers', () => {
    const tagged = (lang: string): LocaleSource => ({ locale: lang, translate: (_key, _params, text) => `${lang}:${text}` });
    const options: FormEngineOptions = { locale: tagged('ru') };
    const engine = new FormEngine(signup, { email: 'ada@example.com' }, options);
    expect(engine.currentStep?.title).toBe('ru:Account');
    const listener = vi.fn();
    engine.subscribe(listener);
    refreshLocale(engine);
    expect(listener).not.toHaveBeenCalled();
    options.locale = tagged('de');
    refreshLocale(engine);
    expect(engine.currentStep?.title).toBe('de:Account');
    expect(engine.definition.lang).toBe('de');
    expect(engine.values.email).toBe('ada@example.com');
    options.locale = undefined;
    refreshLocale(engine);
    expect(engine.definition).toBe(signup);
  });

  it('keeps the source for replaceDefinition', () => {
    const engine = new FormEngine(signup, {}, { locale: form });
    const next = { ...signup, title: 'Next' };
    engine.replaceDefinition(next);
    expect(definitionSource(engine)).toBe(next);
    expect(engine.definition.title).toBe('Создайте аккаунт');
  });

  it('gives the server the same messages as the engine', () => {
    const { definition, messages } = localize(signup, [form, generic]);
    const values = { email: '', kind: 'home', address: 'abc' };
    expect(validateSubmission(definition, values, { messages }).errors).toEqual(
      new FormEngine(signup, values, { locale: [form, generic] }).validate(),
    );
  });

  it('accepts a locale tag and plural forms in a translation file', () => {
    const file = { ...form, messages: { ...ru.messages, minLength: { one: '{min} символ', other: '{min} символов' } } };
    const { missing, unknown, invalid } = translationIssues(signup, file);
    expect(unknown).toEqual([]);
    expect(invalid).toEqual([]);
    expect(missing).not.toContain('messages.minLength');
  });
});

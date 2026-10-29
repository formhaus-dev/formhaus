import { describe, expect, it, vi } from 'vitest';
import { FormEngine, type FormDefinition, type FormEngineOptions, type LocaleCatalog, type LocaleSource } from '../../src';
import { localize, translation, translationIssues } from '../../src/i18n';
import { definitionSource, engineLabel, refreshLocale } from '../../src/internal';
import { validateSubmission } from '../../src/server';
import { ru, signup } from './fixtures';

const generic: LocaleCatalog = {
  locale: 'ru',
  messages: {
    required: 'Общее: обязательно',
    minLength: { one: 'Не менее {min} символа', few: 'Не менее {min} символов', many: 'Не менее {min} символов', other: 'x' },
  },
  labels: { back: 'Назад', stepOf: 'Общий шаг' },
};

const form = translation({ ...ru, locale: 'ru' });
const tagged = (lang: string): LocaleSource => translation({ locale: lang, translate: (_key, _params, text) => `${lang}:${text}` });

describe('the locale option', () => {
  it('keeps the definition object without a translation', () => {
    for (const locale of [undefined, generic]) {
      const engine = new FormEngine(signup, {}, { locale });
      expect(engine.definition).toBe(signup);
      expect(definitionSource(engine)).toBe(signup);
    }
  });

  it('renders definition messages with a built-in catalog as before', () => {
    const own: FormDefinition = { ...signup, messages: { required: 'Own required' }, labels: { stepOf: 'Own {current}' } };
    const engine = new FormEngine(own, { kind: 'home', address: 'abc' }, { locale: generic });
    expect(engine.validate()).toMatchObject({ password: 'Own required', address: 'Не менее 5 символов' });
    expect(engineLabel(engine, 'stepOf', { current: 1, total: 2 })).toBe('Own 1');
    expect(engineLabel(engine, 'back', {})).toBe('Назад');
  });

  it('ranks the form translation over definition messages over the built-in catalog', () => {
    const own: FormDefinition = { ...signup, messages: { required: 'Own required', maxLength: 'Own max' } };
    const engine = new FormEngine(own, { kind: 'home', address: 'abc' }, { locale: [form, generic] });
    expect(engine.definition).toMatchObject({ lang: 'ru', title: 'Создайте аккаунт', submit: { label: 'Создать аккаунт' } });
    expect(engine.currentStep?.title).toBe('Аккаунт');
    expect(engine.visibleFields.map(({ label }) => label)).toEqual(['Почта', 'Пароль', 'Тариф']);
    expect(engine.validate()).toMatchObject({ email: 'Укажите почту', password: 'Обязательное поле' });
    expect(engineLabel(engine, 'stepOf', { current: 1, total: 2 })).toBe('Шаг 1 из 2');
    expect(engineLabel(engine, 'back', {})).toBe('Назад');
    expect(new FormEngine(own, { kind: 'home', address: 'abc' }, { locale: [generic] }).validate().password).toBe('Own required');
  });

  it('asks the latest translate function for messages and labels', () => {
    const options: FormEngineOptions = { locale: translation({ locale: 'de', translate: () => undefined }) };
    const engine = new FormEngine(signup, {}, options);
    expect(engineLabel(engine, 'continue', {})).toBe('Continue');
    options.locale = translation({ locale: 'de', translate: (key) => (key === 'common.next' ? 'Weiter' : undefined) });
    expect(engineLabel(engine, 'continue', {})).toBe('Weiter');
  });

  it('switches the texts on refresh and keeps the answers', () => {
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
    const file = { ...ru, locale: 'ru', messages: { ...ru.messages, minLength: { one: '{min} символ', other: '{min} символов' } } };
    const { missing, unknown, invalid } = translationIssues(signup, file);
    expect(unknown).toEqual([]);
    expect(invalid).toEqual([]);
    expect(missing).not.toContain('messages.minLength');
  });

  it('ranks a translate function over definition messages and labels', () => {
    const own: FormDefinition = { ...signup, messages: { required: 'Own required' }, labels: { back: 'Own back' } };
    const keys: Record<string, string> = { 'errors.required': 'Ключ: обязательно', 'signup.labels.back': 'Ключ: назад' };
    const locale = translation({ locale: 'ru', translate: (key, _params, text) => keys[key] ?? text });
    const engine = new FormEngine(own, { kind: 'home', address: 'abc' }, { locale: [locale, generic] });
    expect(engine.validate().password).toBe('Ключ: обязательно');
    expect(engineLabel(engine, 'back', {})).toBe('Ключ: назад');
  });

  it('ranks plural forms of a translation file over definition messages and labels', () => {
    const own: FormDefinition = { ...signup, messages: { minLength: 'Own {min}' }, labels: { stepErrors: 'Own {count}' } };
    const file = translation({
      locale: 'ru',
      messages: { minLength: { one: 'Файл {min} символ', few: 'Файл {min} символа', many: 'Файл {min} символов', other: 'x' } },
      labels: { stepErrors: { one: '{count} ошибка', few: '{count} ошибки', many: '{count} ошибок', other: 'x' } },
    });
    const engine = new FormEngine(own, { kind: 'home', address: 'abc' }, { locale: [file, generic] });
    expect(engine.validate().address).toBe('Файл 5 символов');
    expect(engineLabel(engine, 'stepErrors', { count: 3 })).toBe('3 ошибки');
  });

  it('translates errors already shown when the locale changes, without new errors or events', () => {
    const onFormEvent = vi.fn();
    const options: FormEngineOptions = { locale: generic, onFormEvent };
    const engine = new FormEngine(signup, { kind: 'home', address: 'abc' }, options);
    engine.validateField('address');
    expect(engine.errors).toEqual({ address: 'Не менее 5 символов' });
    onFormEvent.mockClear();
    options.locale = undefined;
    refreshLocale(engine);
    expect(engine.errors).toEqual({ address: 'Minimum length is 5' });
    expect(onFormEvent).not.toHaveBeenCalled();
  });

  it('skips the refresh when the same sources are passed again', () => {
    const translate = vi.fn((_key: string, _params: Record<string, unknown>, text: string) => `ru:${text}`);
    const options: FormEngineOptions = { locale: [translation({ locale: 'ru', translate }), generic] };
    const engine = new FormEngine(signup, {}, options);
    translate.mockClear();
    options.locale = [translation({ locale: 'ru', translate }), generic];
    refreshLocale(engine);
    expect(translate).not.toHaveBeenCalled();
  });

  it('warns in development when a translation file is passed without translation()', () => {
    const onWarning = vi.fn();
    new FormEngine(signup, {}, { locale: { ...ru, locale: 'ru' } as unknown as LocaleCatalog, onWarning });
    expect(onWarning).toHaveBeenCalledWith(expect.objectContaining({ code: 'untranslated-locale', severity: 'warning' }));
    onWarning.mockClear();
    new FormEngine(signup, {}, { locale: [form, generic], onWarning });
    expect(onWarning).not.toHaveBeenCalledWith(expect.objectContaining({ code: 'untranslated-locale' }));
  });
});

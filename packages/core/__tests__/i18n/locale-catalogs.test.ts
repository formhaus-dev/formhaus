import { afterEach, describe, expect, it, vi } from 'vitest';
import { errorSummary, FormEngine, type FormDefinition, type LocaleCatalog } from '../../src';
import { checkCatalog, defaultLabels, defaultMessages, localeChain, localize } from '../../src/i18n';
import { actionsView, engineLabel } from '../../src/internal';

const characters = (one: string, few: string, many: string, other: string) => ({ one, few, many, other });

const ru: LocaleCatalog = {
  locale: 'ru',
  messages: {
    required: 'Обязательное поле',
    minLength: characters('Не менее {min} символа', 'Не менее {min} символов', 'Не менее {min} символов', 'Не менее {min} символа'),
  },
  labels: {
    continue: 'Далее',
    stepTitle: 'Шаг {index}',
    stepErrors: { one: '{count} ошибка', few: '{count} ошибки', many: '{count} ошибок', other: '{count} ошибки' },
  },
};

const form = (minLength: number, extra: Partial<FormDefinition> = {}): FormDefinition => ({
  id: 'f',
  title: 'F',
  submit: { label: 'Send' },
  fields: [{ key: 'name', type: 'text', label: 'Name', validation: { required: true, minLength } }],
  ...extra,
});

const minLengthError = (
  minLength: number,
  locale: LocaleCatalog | LocaleCatalog[],
  options: object = {},
  extra: Partial<FormDefinition> = {},
) => {
  const engine = new FormEngine(form(minLength, extra), { name: 'a' }, { locale, ...options });
  return engine.validate().name;
};

describe('locale catalogs', () => {
  it('picks the Russian plural form by the min param', () => {
    expect(minLengthError(3, ru)).toBe('Не менее 3 символов');
    expect(minLengthError(5, ru)).toBe('Не менее 5 символов');
    expect(minLengthError(21, ru)).toBe('Не менее 21 символа');
    expect(new FormEngine(form(2), {}, { locale: ru }).validate().name).toBe('Обязательное поле');
  });

  it('picks the French one, many and other forms', () => {
    const fr: LocaleCatalog = {
      locale: 'fr',
      messages: {
        minLength: { one: 'Au moins {min} caractère', many: 'Au moins {min} de caractères', other: 'Au moins {min} caractères' },
      },
      labels: {},
    };
    const tooLong = new FormEngine(
      { ...form(0), fields: [{ key: 'name', type: 'text', label: 'Name', validation: { maxLength: 1 } }] },
      { name: 'ab' },
      { locale: { ...fr, messages: { maxLength: { one: 'Au plus {max} caractère', other: 'Au plus {max} caractères' } } } },
    );
    expect(tooLong.validate().name).toBe('Au plus 1 caractère');
    expect(minLengthError(2, fr)).toBe('Au moins 2 caractères');
    expect(minLengthError(1_000_000, fr)).toBe('Au moins 1 000 000 de caractères');
  });

  it('uses the other form in Japanese and formats numbers for the locale', () => {
    const ja: LocaleCatalog = { locale: 'ja', messages: { minLength: { other: '{min}文字以上で入力してください' } }, labels: {} };
    expect(minLengthError(2, ja)).toBe('2文字以上で入力してください');
    const de: LocaleCatalog = { locale: 'de', messages: { minLength: 'Mindestens {min} Zeichen' }, labels: {} };
    expect(minLengthError(12_000, de)).toBe('Mindestens 12.000 Zeichen');
    expect(minLengthError(12_000, { ...de, locale: 'not a tag' })).toBe('Mindestens 12,000 Zeichen');
  });

  it('takes the first catalog that has the key, then the built-in English', () => {
    const regional: LocaleCatalog = { locale: 'fr-CA', messages: { required: 'Champ requis' }, labels: {} };
    const fr: LocaleCatalog = { locale: 'fr', messages: { required: 'Obligatoire', minLength: 'Au moins {min}' }, labels: {} };
    expect(new FormEngine(form(2), {}, { locale: [regional, fr] }).validate().name).toBe('Champ requis');
    expect(minLengthError(4, [regional, fr])).toBe('Au moins 4');
    expect(minLengthError(4, [])).toBe(defaultMessages.minLength.replace('{min}', '4'));
  });

  it('ranks the messages option over the catalog over definition messages', () => {
    expect(minLengthError(4, ru, {}, { messages: { minLength: 'Definition {min}' } })).toBe('Не менее 4 символов');
    expect(minLengthError(4, ru, { messages: { minLength: 'Option {min}' } }, { messages: { minLength: 'Definition {min}' } })).toBe(
      'Option 4',
    );
  });

  it('reads the locale option when it changes after the engine was created', () => {
    const options: { locale?: LocaleCatalog } = {};
    const engine = new FormEngine(form(4), { name: 'a' }, options);
    expect(engine.validate().name).toBe('Minimum length is 4');
    options.locale = ru;
    expect(engine.validate().name).toBe('Не менее 4 символов');
  });

  it('resolves labels with the same precedence', async () => {
    const steps = [
      { id: 'one', title: '', fields: form(1).fields! },
      { id: 'two', title: 'Two', fields: [{ key: 'note', type: 'text' as const, label: 'Note' }] },
    ];
    const engine = new FormEngine(form(1, { steps, fields: undefined }), {}, { locale: ru });
    expect(engineLabel(engine, 'stepErrors', { count: 3 })).toBe('3 ошибки');
    expect(engineLabel(engine, 'stepErrors', { count: 5 })).toBe('5 ошибок');
    expect(engineLabel(engine, 'continue', {}, { continue: 'Prop' })).toBe('Prop');
    expect(engineLabel(engine, 'back', {})).toBe(defaultLabels.back);
    expect(actionsView(engine).primaryLabel).toBe('Далее');
    await engine.next();
    expect(errorSummary(engine).groups[0].title).toBe('Шаг 1');
  });

  it('falls back to the other form and the plain number without Intl.PluralRules', () => {
    vi.stubGlobal('Intl', Object.create(Intl, { PluralRules: { value: undefined } }));
    const uk: LocaleCatalog = { locale: 'uk', messages: { minLength: { one: 'one {min}', other: 'other {min}' } }, labels: {} };
    expect(minLengthError(21_000, uk)).toBe('other 21000');
  });

  it('falls through to the catalog when a translate function returns the built-in text', () => {
    const translate = (key: string, _params: Record<string, unknown>, fallback: string) =>
      key === 'f.messages.required' ? 'Requis' : fallback;
    const { definition, messages } = localize(form(4), { locale: 'ru', translate });
    expect(new FormEngine(definition, {}, { messages, locale: ru }).validate().name).toBe('Requis');
    expect(new FormEngine(definition, { name: 'a' }, { messages, locale: ru }).validate().name).toBe('Не менее 4 символов');
  });

  it('ignores catalogs without a matching text', () => {
    const broken = { locale: 'ru', messages: { minLength: { one: 'x' } }, labels: {} } as unknown as LocaleCatalog;
    expect(minLengthError(4, [broken, ru])).toBe('Не менее 4 символов');
  });
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('localeChain', () => {
  it('keeps the exact prefixes without Intl.Locale', () => {
    vi.stubGlobal('Intl', Object.create(Intl, { Locale: { value: undefined } }));
    expect(localeChain('zh-Hant')).toEqual(['zh-Hant', 'zh', 'en']);
  });

  it.each([
    ['ja-JP', ['ja-JP', 'ja', 'en']],
    ['zh-hant-tw', ['zh-Hant-TW', 'zh-Hant', 'zh-TW', 'zh', 'en']],
    ['zh-Hans-CN', ['zh-Hans-CN', 'zh-Hans', 'zh-CN', 'zh', 'en']],
    ['zh-Hant', ['zh-Hant', 'zh-TW', 'zh', 'en']],
    ['zh', ['zh', 'zh-CN', 'en']],
    ['pt', ['pt', 'pt-BR', 'en']],
    ['pt_br', ['pt-BR', 'pt', 'en']],
    ['en-US', ['en-US', 'en']],
    ['en', ['en-US', 'en']],
    ['en-US-u-va-posix', ['en-US', 'en']],
    ['de-CH-u-co-phonebk', ['de-CH', 'de', 'en']],
    ['', ['en']],
    ['not a tag', ['en']],
  ])('%s', (tag, chain) => {
    expect(localeChain(tag)).toEqual(chain);
  });
});

describe('checkCatalog', () => {
  it('lists missing and unknown keys', () => {
    const catalog = {
      locale: 'ru',
      region: 'RU',
      messages: { ...defaultMessages, minLength: { one: 'x', several: 'y' }, typo: 'z' },
      labels: { ...defaultLabels, back: ' ' },
    };
    expect(checkCatalog(catalog)).toEqual({
      missing: ['messages.minLength.other', 'labels.back'],
      unknown: ['region', 'messages.minLength.several', 'messages.typo'],
    });
  });

  it('accepts a complete catalog and reports everything for a non-object', () => {
    expect(checkCatalog({ locale: 'en', messages: defaultMessages, labels: defaultLabels })).toEqual({ missing: [], unknown: [] });
    const { missing } = checkCatalog(null);
    expect(missing).toHaveLength(1 + Object.keys(defaultMessages).length + Object.keys(defaultLabels).length);
  });
});

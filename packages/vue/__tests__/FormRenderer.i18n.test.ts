import { fireEvent, render, screen } from '@testing-library/vue';
import { defineComponent, h, type PropType } from 'vue';
import { createI18n } from 'vue-i18n';
import { describe, expect, it } from 'vitest';
import FormRenderer from '../src/FormRenderer.vue';
import { type LocalizeSource, useLocalizedForm } from '../src/i18n';
import { definition, overlay, resources } from './i18n.fixtures';

const i18n = createI18n({ legacy: false, locale: 'ru', fallbackLocale: 'en', fallbackWarn: false, missingWarn: false, messages: { ru: resources, en: {} } });
const { t, te, locale } = i18n.global;
const translate = (key: string, params: Record<string, unknown>, fallback: string) => (te(key) ? t(key, params) : fallback);

const Signup = defineComponent({
  props: { source: { type: Function as PropType<() => LocalizeSource | undefined>, required: true } },
  setup(props) {
    const localized = useLocalizedForm(definition, () => props.source());
    return () => h(FormRenderer, { ...localized.value, errorSummary: true, onSubmit: () => {} });
  },
});

async function checkRussianForm(passwordError: string) {
  expect(document.querySelector('form')?.getAttribute('lang')).toBe('ru');
  expect(screen.getByRole('heading', { name: 'Аккаунт' })).toBeTruthy();
  expect(screen.getByText('Шаг 1 из 2')).toBeTruthy();
  await fireEvent.click(screen.getByRole('button', { name: 'Далее' }));
  expect(await screen.findAllByText('Обязательное поле')).toHaveLength(2);
  await fireEvent.update(screen.getByLabelText(/Почта/), 'ada@example.com');
  await fireEvent.update(screen.getByLabelText(/Пароль/), 'short');
  await fireEvent.click(screen.getByRole('button', { name: 'Далее' }));
  expect(await screen.findByText(passwordError)).toBeTruthy();
  await fireEvent.update(screen.getByLabelText(/Пароль/), 'secret123');
  await fireEvent.click(screen.getByRole('button', { name: 'Далее' }));
  expect(await screen.findByText('Шаг 2 из 2')).toBeTruthy();
  expect(screen.getByRole('heading', { name: 'Plan' })).toBeTruthy();
  expect(screen.getByRole('radio', { name: 'Бесплатный' })).toBeTruthy();
  expect(screen.getByRole('radio', { name: 'Pro' })).toBeTruthy();
  expect(screen.getByRole('button', { name: 'Назад' })).toBeTruthy();
  expect(screen.getByRole('button', { name: 'Создать аккаунт' })).toBeTruthy();
}

describe('Vue localized forms', () => {
  it('resolves explicit keys through vue-i18n with source fallback', async () => {
    render(Signup, { props: { source: () => ({ translate, lang: locale.value }) } });
    await checkRussianForm('Минимум 8 символов');
  });

  it('applies an overlay', async () => {
    render(Signup, { props: { source: () => ({ overlay, lang: 'ru' }) } });
    await checkRussianForm('Пароль: от 8 символов');
  });

  it('rebuilds the form in the new language when the locale changes', async () => {
    render(Signup, { props: { source: () => ({ translate, lang: locale.value }) } });
    expect(screen.getByRole('heading', { name: 'Аккаунт' })).toBeTruthy();
    locale.value = 'en';
    expect(await screen.findByRole('heading', { name: 'Account' })).toBeTruthy();
    expect(document.querySelector('form')?.getAttribute('lang')).toBe('en');
    locale.value = 'ru';
  });

  it('takes messages and labels props without localize', async () => {
    render(FormRenderer, { props: { definition, messages: { required: 'Pflichtfeld' }, labels: (key: string, params: Record<string, unknown>) => (key === 'stepOf' ? `${params.current}/${params.total}` : undefined), onSubmit: () => {} } });
    expect(screen.getByText('1/2')).toBeTruthy();
    await fireEvent.click(screen.getByRole('button', { name: 'Continue' }));
    expect(await screen.findAllByText('Pflichtfeld')).toHaveLength(2);
  });

  it('keeps the definition when there is no translation', () => {
    render(Signup, { props: { source: () => undefined } });
    expect(screen.getByRole('heading', { name: 'Account' })).toBeTruthy();
    expect(screen.getByText('Step 1 of 2')).toBeTruthy();
  });
});

import { fireEvent, render, screen } from '@testing-library/vue';
import { defineComponent, h, type PropType } from 'vue';
import { createI18n } from 'vue-i18n';
import { describe, expect, it } from 'vitest';
import FormActions from '../src/FormActions.vue';
import FormRenderer from '../src/FormRenderer.vue';
import FormStepProgress from '../src/FormStepProgress.vue';
import type { LocaleSource } from '@formhaus/core';
import { translation } from '@formhaus/core/i18n';
import { definition, overlay, resources } from './i18n.fixtures';

const i18n = createI18n({
  legacy: false,
  locale: 'ru',
  fallbackLocale: 'en',
  fallbackWarn: false,
  missingWarn: false,
  messages: { ru: resources, en: {} },
});
const { t, te, locale } = i18n.global;
const translate = (key: string, params: Record<string, unknown>, fallback: string) => (te(key) ? t(key, params) : fallback);

const Signup = defineComponent({
  props: { source: { type: Function as PropType<() => LocaleSource | undefined>, required: true } },
  setup(props) {
    return () => h(FormRenderer, { definition, locale: props.source(), errorSummary: true, onSubmit: () => {} });
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
    render(Signup, { props: { source: () => translation({ translate, locale: locale.value }) } });
    await checkRussianForm('Минимум 8 символов');
  });

  it('applies an overlay', async () => {
    render(Signup, { props: { source: () => translation({ ...overlay, locale: 'ru' }) } });
    await checkRussianForm('Пароль: от 8 символов');
  });

  it('switches the language when the locale changes and keeps the answers', async () => {
    render(Signup, { props: { source: () => translation({ translate, locale: locale.value }) } });
    expect(screen.getByRole('heading', { name: 'Аккаунт' })).toBeTruthy();
    await fireEvent.update(screen.getByLabelText(/Почта/), 'kept@example.com');
    locale.value = 'en';
    expect(await screen.findByRole('heading', { name: 'Account' })).toBeTruthy();
    expect(document.querySelector('form')?.getAttribute('lang')).toBe('en');
    expect((screen.getByLabelText(/Email/) as HTMLInputElement).value).toBe('kept@example.com');
    locale.value = 'ru';
  });

  it('takes messages and labels props without a locale', async () => {
    render(FormRenderer, {
      props: {
        definition,
        messages: { required: 'Pflichtfeld' },
        labels: (key: string, params: Record<string, unknown>) => (key === 'stepOf' ? `${params.current}/${params.total}` : undefined),
        onSubmit: () => {},
      },
    });
    expect(screen.getByText('1/2')).toBeTruthy();
    await fireEvent.click(screen.getByRole('button', { name: 'Continue' }));
    expect(await screen.findAllByText('Pflichtfeld')).toHaveLength(2);
  });

  it('keeps the definition when there is no locale', () => {
    render(Signup, { props: { source: () => undefined } });
    expect(screen.getByRole('heading', { name: 'Account' })).toBeTruthy();
    expect(screen.getByText('Step 1 of 2')).toBeTruthy();
  });

  it('formats a standalone step progress and action bar with the default labels', () => {
    render(FormStepProgress, {
      props: {
        current: 2,
        total: 2,
        steps: [
          { id: 'a', title: '', errorCount: 3 },
          { id: 'b', title: 'B', errorCount: 0 },
        ],
      },
    });
    render(FormActions, { props: { isFirstStep: false, isLastStep: true, isMultiStep: true, showBack: true } });
    expect(screen.getByText('Step 2 of 2')).toBeTruthy();
    expect([...document.querySelectorAll('.fh-step-progress__step')].map((item) => item.textContent?.trim())).toEqual([
      'Step 1 · Errors: 3',
      'B',
    ]);
    expect(screen.getByRole('button', { name: 'Submit' })).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Back' })).toBeTruthy();
  });
});

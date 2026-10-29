import { fireEvent, render, screen } from '@testing-library/react';
import { createInstance } from 'i18next';
import { describe, expect, it } from 'vitest';
import { FormActions } from '../src/FormActions';
import { FormRenderer } from '../src/FormRenderer';
import { FormStepProgress } from '../src/FormStepProgress';
import type { LocaleSource } from '@formhaus/core';
import { translation } from '@formhaus/core/i18n';
import { definition, overlay, resources } from './i18n.fixtures';

const i18n = createInstance();
await i18n.init({ lng: 'ru', resources: { ru: { forms: resources } }, defaultNS: 'forms', interpolation: { escapeValue: false } });

const translate = translation({ locale: 'ru', translate: (key, params, defaultValue) => i18n.t(key, { ...params, defaultValue }) });

function Signup({ locale }: { locale?: LocaleSource | LocaleSource[] }) {
  return <FormRenderer definition={definition} locale={locale} errorSummary onSubmit={() => {}} />;
}

async function checkRussianForm(passwordError: string) {
  expect(document.querySelector('form')?.getAttribute('lang')).toBe('ru');
  expect(screen.getByRole('heading', { name: 'Аккаунт' })).toBeTruthy();
  expect(screen.getByText('Шаг 1 из 2')).toBeTruthy();
  fireEvent.click(screen.getByRole('button', { name: 'Далее' }));
  expect(await screen.findAllByText('Обязательное поле')).toHaveLength(2);
  expect(screen.getByText('Check these answers')).toBeTruthy();
  fireEvent.change(screen.getByLabelText(/Почта/), { target: { value: 'ada@example.com' } });
  fireEvent.change(screen.getByLabelText(/Пароль/), { target: { value: 'short' } });
  fireEvent.click(screen.getByRole('button', { name: 'Далее' }));
  expect(await screen.findByText(passwordError)).toBeTruthy();
  fireEvent.change(screen.getByLabelText(/Пароль/), { target: { value: 'secret123' } });
  fireEvent.click(screen.getByRole('button', { name: 'Далее' }));
  expect(await screen.findByText('Шаг 2 из 2')).toBeTruthy();
  expect(screen.getByRole('heading', { name: 'Plan' })).toBeTruthy();
  expect(screen.getByRole('radio', { name: 'Бесплатный' })).toBeTruthy();
  expect(screen.getByRole('radio', { name: 'Pro' })).toBeTruthy();
  expect(screen.getByRole('button', { name: 'Назад' })).toBeTruthy();
  expect(screen.getByRole('button', { name: 'Создать аккаунт' })).toBeTruthy();
}

describe('localized forms', () => {
  it('resolves explicit keys through an i18next translate function with source fallback', async () => {
    render(<Signup locale={translate} />);
    expect(screen.getByLabelText(/Почта/)).toBeTruthy();
    await checkRussianForm('Минимум 8 символов');
  });

  it('applies an overlay with its locale', async () => {
    render(<Signup locale={translation({ ...overlay, locale: 'ru' })} />);
    await checkRussianForm('Пароль: от 8 символов');
  });

  it('takes messages and labels props without a locale', async () => {
    render(
      <FormRenderer
        definition={definition}
        messages={{ required: 'Pflichtfeld' }}
        labels={(key, params) => (key === 'stepOf' ? `${params.current}/${params.total}` : undefined)}
        onSubmit={() => {}}
      />,
    );
    expect(screen.getByText('1/2')).toBeTruthy();
    expect(document.querySelector('form')?.getAttribute('lang')).toBe('en');
    fireEvent.click(screen.getByRole('button', { name: 'Continue' }));
    expect(await screen.findAllByText('Pflichtfeld')).toHaveLength(2);
  });

  it('keeps the definition when there is no locale', () => {
    render(<Signup />);
    expect(screen.getByRole('heading', { name: 'Account' })).toBeTruthy();
    expect(screen.getByText('Step 1 of 2')).toBeTruthy();
  });

  it('keeps the answers when the locale is recreated or translate is an inline arrow', () => {
    function Inline({ tick }: { tick: number }) {
      return (
        <>
          <output>{tick}</output>
          <Signup
            locale={translation({ locale: 'ru', translate: (key, params, defaultValue) => i18n.t(key, { ...params, defaultValue }) })}
          />
        </>
      );
    }
    const { rerender } = render(<Inline tick={0} />);
    fireEvent.change(screen.getByLabelText(/Почта/), { target: { value: 'kept@example.com' } });
    rerender(<Inline tick={1} />);
    expect((screen.getByLabelText(/Почта/) as HTMLInputElement).value).toBe('kept@example.com');
  });

  it('switches the language and keeps the answers', () => {
    const tagged = (lang: string): LocaleSource =>
      translation({ locale: lang, translate: (_key, _params, defaultValue) => `${lang}:${defaultValue}` });
    const { rerender } = render(<Signup locale={tagged('ru')} />);
    expect(screen.getByRole('heading', { name: 'ru:Account' })).toBeTruthy();
    fireEvent.change(screen.getByLabelText(/Email/), { target: { value: 'kept@example.com' } });
    rerender(<Signup locale={tagged('de')} />);
    expect(screen.getByRole('heading', { name: 'de:Account' })).toBeTruthy();
    expect(document.querySelector('form')?.getAttribute('lang')).toBe('de');
    expect((screen.getByLabelText(/Email/) as HTMLInputElement).value).toBe('kept@example.com');
    rerender(<Signup />);
    expect(screen.getByRole('heading', { name: 'Account' })).toBeTruthy();
  });

  it('formats a standalone step progress and action bar with the default labels', () => {
    render(
      <>
        <FormStepProgress
          current={2}
          total={2}
          steps={[
            { id: 'a', title: '', errorCount: 3 },
            { id: 'b', title: 'B', errorCount: 0 },
          ]}
        />
        <FormActions
          isFirstStep={false}
          isLastStep
          isMultiStep
          onSubmit={() => {}}
          onNext={() => {}}
          onBack={() => {}}
          onCancel={() => {}}
        />
      </>,
    );
    expect(screen.getByText('Step 2 of 2')).toBeTruthy();
    expect([...document.querySelectorAll('.fh-step-progress__step')].map((item) => item.textContent)).toEqual(['Step 1 · Errors: 3', 'B']);
    expect(screen.getByRole('button', { name: 'Submit' })).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Back' })).toBeTruthy();
  });
});

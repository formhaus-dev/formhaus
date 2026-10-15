import { fireEvent, render, screen } from '@testing-library/react';
import { createInstance } from 'i18next';
import { describe, expect, it } from 'vitest';
import { FormRenderer } from '../src/FormRenderer';
import { type LocalizeSource, useLocalizedForm } from '../src/i18n';
import { definition, overlay, resources } from './i18n.fixtures';

const i18n = createInstance();
await i18n.init({ lng: 'ru', resources: { ru: { forms: resources } }, defaultNS: 'forms', interpolation: { escapeValue: false } });

const translate: LocalizeSource = { translate: (key, params, defaultValue) => i18n.t(key, { ...params, defaultValue }), lang: 'ru' };

function Signup({ source }: { source: LocalizeSource }) {
  const localized = useLocalizedForm(definition, source);
  return <FormRenderer {...localized} errorSummary onSubmit={() => {}} />;
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
    render(<Signup source={translate} />);
    expect(screen.getByLabelText(/Почта/)).toBeTruthy();
    await checkRussianForm('Минимум 8 символов');
  });

  it('applies an overlay', async () => {
    render(<Signup source={{ overlay, lang: 'ru' }} />);
    await checkRussianForm('Пароль: от 8 символов');
  });

  it('takes messages and labels props without localize', async () => {
    render(<FormRenderer definition={definition} messages={{ required: 'Pflichtfeld' }} labels={(key, params) => (key === 'stepOf' ? `${params.current}/${params.total}` : undefined)} onSubmit={() => {}} />);
    expect(screen.getByText('1/2')).toBeTruthy();
    expect(document.querySelector('form')?.getAttribute('lang')).toBe('en');
    fireEvent.click(screen.getByRole('button', { name: 'Continue' }));
    expect(await screen.findAllByText('Pflichtfeld')).toHaveLength(2);
  });

  it('keeps the definition when there is no translation', () => {
    function Source() {
      const localized = useLocalizedForm(definition);
      return <FormRenderer {...localized} onSubmit={() => {}} />;
    }
    render(<Source />);
    expect(screen.getByRole('heading', { name: 'Account' })).toBeTruthy();
    expect(screen.getByText('Step 1 of 2')).toBeTruthy();
  });

  it('keeps the engine while the source is unchanged', () => {
    const { rerender } = render(<Signup source={translate} />);
    fireEvent.change(screen.getByLabelText(/Почта/), { target: { value: 'kept@example.com' } });
    rerender(<Signup source={{ ...translate }} />);
    expect((screen.getByLabelText(/Почта/) as HTMLInputElement).value).toBe('kept@example.com');
  });
});

import type { FormDefinition } from '@formhaus/core';

export const definition: FormDefinition = {
  id: 'signup',
  lang: 'en',
  title: 'Create your account',
  i18n: { messages: { required: 'errors.required' }, labels: { continue: 'common.next', back: 'common.back' } },
  submit: { label: 'Create account', i18n: { label: 'signup.submit' } },
  steps: [
    {
      id: 'account',
      title: 'Account',
      i18n: { title: 'signup.steps.account' },
      fields: [
        { key: 'email', type: 'email', label: 'Email', i18n: { label: 'signup.email.label' }, validation: { required: true } },
        { key: 'password', type: 'password', label: 'Password', i18n: { label: 'signup.password.label' }, validation: { required: true, minLength: 8 } },
      ],
    },
    {
      id: 'plan',
      title: 'Plan',
      i18n: { title: 'signup.steps.plan' },
      fields: [{
        key: 'plan', type: 'radio', label: 'Plan', i18n: { label: 'signup.plan.label' }, validation: { required: true },
        options: [{ value: 'free', label: 'Free', i18n: { label: 'plans.free' } }, { value: 'pro', label: 'Pro' }],
      }],
    },
  ],
};

export const resources = {
  errors: { required: 'Обязательное поле' },
  common: { next: 'Далее', back: 'Назад' },
  plans: { free: 'Бесплатный' },
  signup: {
    submit: 'Создать аккаунт',
    steps: { account: 'Аккаунт' },
    email: { label: 'Почта' },
    password: { label: 'Пароль' },
    plan: { label: 'Тариф' },
    messages: { minLength: 'Минимум {{min}} символов' },
    labels: { stepOf: 'Шаг {{current}} из {{total}}' },
  },
};

export const overlay = {
  submit: { label: 'Создать аккаунт' },
  messages: { required: 'Обязательное поле', minLength: 'Минимум {min} символов' },
  labels: { continue: 'Далее', back: 'Назад', stepOf: 'Шаг {current} из {total}' },
  steps: {
    account: { title: 'Аккаунт', fields: { email: { label: 'Почта' }, password: { label: 'Пароль', validation: { minLength: 'Пароль: от {min} символов' } } } },
    plan: { fields: { plan: { label: 'Тариф', options: { free: 'Бесплатный' } } } },
  },
};

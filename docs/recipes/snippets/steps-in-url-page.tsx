import type { FormDefinition } from '@formhaus/core';
import { StepsInUrl } from './steps-in-url';

const definition: FormDefinition = {
  id: 'signup',
  title: 'Sign up',
  submit: { label: 'Create account' },
  steps: [
    { id: 'account', title: 'Account', fields: [{ key: 'email', type: 'email', label: 'Email', validation: { required: true } }] },
    { id: 'profile', title: 'Profile', fields: [{ key: 'name', type: 'text', label: 'Name' }] },
  ],
};

async function save(values: Record<string, unknown>) {
  'use server';
  console.log(values);
}

export default function Page() {
  return <StepsInUrl definition={definition} onSubmit={save} />;
}

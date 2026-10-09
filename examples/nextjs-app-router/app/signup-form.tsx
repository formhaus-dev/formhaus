'use client';

import type { FormDefinition } from '@formhaus/core';
import { FormRenderer } from '@formhaus/react';
import { useState } from 'react';

type SubmitResponse =
  | { values: Record<string, unknown> }
  | { errors: Record<string, string> }
  | { message: string };

export function SignupForm({ definition }: { definition: FormDefinition }) {
  const [errors, setErrors] = useState<Record<string, string>>();
  const [message, setMessage] = useState<string | null>(null);
  const [saved, setSaved] = useState<Record<string, unknown> | null>(null);

  async function submit(values: Record<string, unknown>) {
    const response = await fetch('/api/submit', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(values),
    });
    const result = (await response.json()) as SubmitResponse;
    setMessage('message' in result ? result.message : null);
    if ('errors' in result) setErrors(result.errors);
    if ('values' in result) setSaved(result.values);
  }

  if (saved) return <pre>{JSON.stringify(saved, null, 2)}</pre>;

  return (
    <>
      {message && <p role="alert">{message}</p>}
      <FormRenderer definition={definition} errors={errors} onSubmit={submit} />
    </>
  );
}

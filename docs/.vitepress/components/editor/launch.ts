import type { FormDefinition } from '@formhaus/core';

export const appUrl = 'https://app.formhaus.dev';

const reasons: Record<number, string> = {
  400: 'Formhaus Cloud could not read this form. Check the JSON tab for errors.',
  413: 'This form is too large to send. Download the JSON instead.',
  429: 'Too many launches from this network. Try again in a few minutes.',
};

const unreachable = 'Formhaus Cloud did not answer. Your draft is safe in this browser, try again in a moment.';

export async function launch(definition: FormDefinition): Promise<string> {
  const response = await fetch(`${appUrl}/api/handoffs`, {
    method: 'POST',
    credentials: 'omit',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(definition),
  }).catch(() => null);
  if (!response) throw new Error(unreachable);
  if (!response.ok) throw new Error(reasons[response.status] ?? unreachable);
  const body: unknown = await response.json().catch(() => null);
  const url = typeof body === 'object' && body !== null && 'url' in body ? body.url : null;
  if (typeof url !== 'string' || !url.startsWith(`${appUrl}/start/`)) throw new Error(unreachable);
  return url;
}

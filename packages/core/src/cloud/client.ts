import type { FormDefinition } from '../types';
import { toCloudError } from './error';
import { randomId } from './uuid';

const DEFAULT_API_BASE = 'https://api.formhaus.dev';

export interface CloudSubmission {
  id: string;
  values: Record<string, unknown>;
}

export interface CloudClientOptions {
  id: string;
  apiBase?: string;
}

function endpoint({ id, apiBase = DEFAULT_API_BASE }: CloudClientOptions): string {
  return `${apiBase.replace(/\/+$/, '')}/f/${encodeURIComponent(id)}`;
}

export async function fetchDefinition(options: CloudClientOptions, signal?: AbortSignal): Promise<FormDefinition> {
  const response = await fetch(`${endpoint(options)}/definition`, { signal });
  if (!response.ok) throw await toCloudError(response);
  return await response.json() as FormDefinition;
}

export function createSubmitter(options: CloudClientOptions) {
  let pending: { body: string; key: string } | null = null;

  return async (values: Record<string, unknown>, skippedSteps: string[] = []): Promise<CloudSubmission> => {
    const body = JSON.stringify({ values, skippedSteps });
    if (pending?.body !== body) pending = { body, key: randomId() };
    const response = await fetch(endpoint(options), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Idempotency-Key': pending.key },
      body,
    });
    if (!response.ok) throw await toCloudError(response);
    pending = null;
    return await response.json() as CloudSubmission;
  };
}

import type { FormDefinition } from '../types';
import { networkError, readJson, toCloudError } from './error';
import { randomId } from './uuid';

const DEFAULT_API_BASE = 'https://api.formhaus.dev';
const VERSION_HEADER = 'Formhaus-Version';

export interface CloudSubmission {
  id: string;
  values: Record<string, unknown>;
}

export interface CloudClientOptions {
  id: string;
  apiBase?: string;
}

export interface PublishedDefinition {
  definition: FormDefinition;
  version?: number;
}

function endpoint({ id, apiBase = DEFAULT_API_BASE }: CloudClientOptions): string {
  return `${apiBase.replace(/\/+$/, '')}/f/${encodeURIComponent(id)}`;
}

const LOAD_TIMEOUT = 15_000;
const SUBMIT_TIMEOUT = 30_000;

async function send(url: string, timeout: number, init: CloudRequestInit = {}, signal?: AbortSignal): Promise<CloudResponse> {
  const controller = new AbortController();
  const abort = () => controller.abort();
  const timer = setTimeout(abort, timeout);
  if (signal?.aborted) abort();
  signal?.addEventListener('abort', abort);
  try {
    return await fetch(url, { ...init, signal: controller.signal });
  } catch (error) {
    if (signal?.aborted) throw error;
    throw networkError(error, controller.signal.aborted ? 'timeout' : 'network');
  } finally {
    clearTimeout(timer);
    signal?.removeEventListener('abort', abort);
  }
}

function versionOf(response: CloudResponse): number | undefined {
  const version = Number(response.headers?.get(VERSION_HEADER));
  return Number.isInteger(version) && version > 0 ? version : undefined;
}

export async function fetchPublished(options: CloudClientOptions, signal?: AbortSignal, after?: number): Promise<PublishedDefinition> {
  const query = after === undefined ? '' : `?v=${after}`;
  const response = await send(`${endpoint(options)}/definition${query}`, LOAD_TIMEOUT, {}, signal);
  if (!response.ok) throw await toCloudError(response);
  return { definition: await readJson(response) as FormDefinition, version: versionOf(response) };
}

export async function fetchDefinition(options: CloudClientOptions, signal?: AbortSignal): Promise<FormDefinition> {
  return (await fetchPublished(options, signal)).definition;
}

export interface CloudSubmitterOptions extends CloudClientOptions {
  version?: number;
}

export function createSubmitter(options: CloudSubmitterOptions) {
  let pending: { body: string; key: string } | null = null;

  return async (values: Record<string, unknown>, skippedSteps: string[] = []): Promise<CloudSubmission> => {
    const body = JSON.stringify({ values, skippedSteps, version: options.version });
    if (pending?.body !== body) pending = { body, key: randomId() };
    const response = await send(endpoint(options), SUBMIT_TIMEOUT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Idempotency-Key': pending.key },
      body,
    });
    if (!response.ok) throw await toCloudError(response);
    const submission = await readJson(response) as CloudSubmission;
    pending = null;
    return submission;
  };
}

import { networkError, readJson, toCloudError } from './error';
import { parseForm, type CloudSettings, type PublishedForm } from './envelope';
import { createUploader } from './files';
import { randomId } from './uuid';

const DEFAULT_API_BASE = 'https://api.formhaus.cc';
const CORE = `core=${__FORMHAUS_CORE_VERSION__}`;

export interface CloudSubmission {
  id: string;
  values: Record<string, unknown>;
  ending?: CloudSettings;
}

export interface CloudClientOptions {
  id: string;
  apiBase?: string;
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

export function createFileUploader(options: CloudClientOptions) {
  return createUploader(`${endpoint(options)}/uploads?${CORE}`, (url, init, timeout, signal) => send(url, timeout, init, signal));
}

export interface FetchFormOptions extends CloudClientOptions {
  signal?: AbortSignal;
  version?: number;
}

export async function fetchForm(options: FetchFormOptions): Promise<PublishedForm> {
  const { signal, version } = options;
  const query = version === undefined ? CORE : `${CORE}&v=${version}`;
  const response = await send(`${endpoint(options)}/form?${query}`, LOAD_TIMEOUT, {}, signal);
  if (!response.ok) throw await toCloudError(response);
  return parseForm(await readJson(response), response);
}

export interface CloudSubmitterOptions extends CloudClientOptions {
  version?: number;
  renderToken?: string;
  firstRenderToken?: string;
  extraBody?: () => Record<string, unknown>;
}

function attribution(): Record<string, string> {
  const params = new URLSearchParams((globalThis as { location?: { search: string } }).location?.search);
  const found: Record<string, string> = {};
  for (const name of ['source', 'medium', 'campaign', 'term', 'content']) {
    const value = [...(params.get(`utm_${name}`) ?? '').replace(/[\p{Cc}\p{Cf}\p{Variation_Selector}]/gu, '').trim()]
      .slice(0, 100)
      .join('')
      .trim();
    if (value) found[`utm_${name}`] = value;
  }
  return found;
}

export interface CloudSubmitOptions {
  skippedSteps?: string[];
  challengeToken?: string;
}

export type CloudSubmitFn = (values: Record<string, unknown>, options?: CloudSubmitOptions) => Promise<CloudSubmission>;

export function createSubmitter(options: CloudSubmitterOptions): CloudSubmitFn {
  let pending: { stable: string; key: string } | null = null;

  return async (values, { skippedSteps = [], challengeToken } = {}) => {
    const body = JSON.stringify({
      attribution: attribution(),
      ...options.extraBody?.(),
      values,
      skippedSteps,
      version: options.version,
      _fh_rt: options.renderToken,
      ...(options.firstRenderToken && { _fh_rt_first: options.firstRenderToken }),
      ...(challengeToken && { _fh_ts: challengeToken }),
    });
    const stable = JSON.stringify([values, skippedSteps]);
    if (pending?.stable !== stable) pending = { stable, key: randomId() };
    const response = await send(`${endpoint(options)}?${CORE}`, SUBMIT_TIMEOUT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Idempotency-Key': pending.key },
      body,
    });
    if (!response.ok) throw await toCloudError(response);
    const submission = (await readJson(response)) as CloudSubmission;
    pending = null;
    return submission;
  };
}

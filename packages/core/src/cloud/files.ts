import type { FormDefinition, FormField, FormNode } from '../types';
import { multipleFiles } from '../validation/type-checks';
import { CloudError, isRecord, readJson } from './error';

const UPLOAD_FAILED = 'The upload failed. Try again.';
const TOO_MANY = 'Too many uploads right now. Try again in a few minutes.';
const UPLOAD_GONE = 'Upload the file again.';
const UPLOAD_DEADLINE = 840_000;

interface UploadTicket {
  id: string;
  url: string;
  method: string;
  headers: Record<string, string>;
}

export type Send = (url: string, init: CloudRequestInit, timeout: number, signal?: AbortSignal) => Promise<CloudResponse>;

class UploadError extends Error {}

function isFile(value: unknown): value is CloudFile {
  return isRecord(value) && typeof value.name === 'string' && typeof value.size === 'number' && typeof value.arrayBuffer === 'function';
}

function fileFields(nodes: FormNode[] = []): FormField[] {
  return nodes.flatMap((node) =>
    node.type === 'section' ? fileFields((node as { fields: FormNode[] }).fields) : node.type === 'file' ? [node as FormField] : [],
  );
}

const fieldsOf = (definition: FormDefinition) =>
  fileFields([...(definition.fields ?? []), ...(definition.steps ?? []).flatMap((step) => step.fields)]);

const keysOf = (definition: FormDefinition) => new Set(fieldsOf(definition).map((field) => field.key));

const filesIn = (value: unknown) => [value].flat().filter(isFile);

export const uploadGone = (definition: FormDefinition, values: Record<string, unknown>, errors: Record<string, string> = {}) =>
  [...keysOf(definition)].some((key) => filesIn(values[key]).length > 0 && String(errors[key] ?? '').endsWith(UPLOAD_GONE));

function bounded<T>(work: Promise<T>, signal: AbortSignal): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const stop = () => reject(new UploadError(UPLOAD_FAILED));
    if (signal.aborted) stop();
    signal.addEventListener('abort', stop);
    work.then(resolve, reject).finally(() => signal.removeEventListener('abort', stop));
  });
}

async function refusal(response: CloudResponse): Promise<string> {
  if (response.status === 429) return TOO_MANY;
  const body: unknown = await response.json().catch(() => null);
  return isRecord(body) && typeof body.message === 'string' ? body.message : UPLOAD_FAILED;
}

async function uploadFile(endpoint: string, send: Send, field: string, file: CloudFile, signal?: AbortSignal): Promise<string> {
  const deadline = new AbortController();
  const stop = () => deadline.abort();
  const timer = setTimeout(stop, UPLOAD_DEADLINE);
  if (signal?.aborted) stop();
  signal?.addEventListener('abort', stop);
  try {
    const response = await send(
      endpoint,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ field, name: file.name, size: file.size }),
      },
      15_000,
      deadline.signal,
    );
    if (!response.ok) throw new UploadError(await bounded(refusal(response), deadline.signal));
    const ticket = (await bounded(readJson(response), deadline.signal)) as UploadTicket;
    const stored = await send(ticket.url, { method: ticket.method, headers: ticket.headers, body: file }, 120_000, deadline.signal);
    if (!stored.ok) throw new UploadError(UPLOAD_FAILED);
    return ticket.id;
  } finally {
    clearTimeout(timer);
    signal?.removeEventListener('abort', stop);
  }
}

export function createUploader(endpoint: string, send: Send) {
  const uploaded = new WeakMap<CloudFile, Map<string, string>>();
  const idsOf = (file: CloudFile) => uploaded.get(file) ?? uploaded.set(file, new Map()).get(file)!;
  async function idOf(key: string, file: CloudFile, signal?: AbortSignal): Promise<string> {
    let id = idsOf(file).get(key);
    if (id === undefined) {
      id = await uploadFile(endpoint, send, key, file, signal);
      idsOf(file).set(key, id);
    }
    return id;
  }
  return {
    async upload(definition: FormDefinition, values: Record<string, unknown>, signal?: AbortSignal): Promise<Record<string, unknown>> {
      const sent = { ...values };
      const errors: Record<string, string> = {};
      const seen = new Set<string>();
      await Promise.all(
        fieldsOf(definition).map(async (field) => {
          const { key } = field;
          const value = values[key];
          const list = multipleFiles(definition, field) && Array.isArray(value);
          if (seen.has(key) || !(list ? value.some(isFile) : isFile(value))) return;
          seen.add(key);
          try {
            if (!list) sent[key] = await idOf(key, value as CloudFile, signal);
            else {
              const ids: unknown[] = [];
              for (const item of value) ids.push(isFile(item) ? await idOf(key, item, signal) : item);
              sent[key] = ids;
            }
          } catch (error) {
            if (signal?.aborted) throw error;
            errors[key] = error instanceof UploadError ? error.message : UPLOAD_FAILED;
          }
        }),
      );
      if (Object.keys(errors).length > 0) throw new CloudError({ status: 422, code: 'invalid', errors });
      return sent;
    },
    forget(values: Record<string, unknown>, keys: string[]): void {
      for (const key of keys) for (const file of filesIn(values[key])) uploaded.get(file)?.delete(key);
    },
  };
}

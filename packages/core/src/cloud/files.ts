import type { FormDefinition, FormNode } from '../types';
import { CloudError, isRecord, readJson } from './error';

const UPLOAD_FAILED = 'The upload failed. Try again.';
const TOO_MANY = 'Too many uploads right now. Try again in a minute.';
const UPLOAD_DEADLINE = 135_000;

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

function fileKeys(nodes: FormNode[] = []): string[] {
  return nodes.flatMap((node) =>
    node.type === 'section' ? fileKeys((node as { fields: FormNode[] }).fields) : node.type === 'file' ? [node.key] : [],
  );
}

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
  const uploaded = new WeakMap<CloudFile, string>();
  return {
    async upload(definition: FormDefinition, values: Record<string, unknown>, signal?: AbortSignal): Promise<Record<string, unknown>> {
      const sent = { ...values };
      const errors: Record<string, string> = {};
      const keys = new Set(fileKeys([...(definition.fields ?? []), ...(definition.steps ?? []).flatMap((step) => step.fields)]));
      await Promise.all(
        [...keys].map(async (key) => {
          const file = values[key];
          if (!isFile(file)) return;
          try {
            let id = uploaded.get(file);
            if (id === undefined) {
              id = await uploadFile(endpoint, send, key, file, signal);
              uploaded.set(file, id);
            }
            sent[key] = id;
          } catch (error) {
            if (signal?.aborted) throw error;
            errors[key] = error instanceof UploadError ? error.message : UPLOAD_FAILED;
          }
        }),
      );
      if (Object.keys(errors).length > 0) throw new CloudError(422, 'invalid', errors);
      return sent;
    },
    forget(values: Record<string, unknown>, keys: string[]): void {
      for (const key of keys) {
        const file = values[key];
        if (isFile(file)) uploaded.delete(file);
      }
    },
  };
}

import type { FormDefinition, FormNode } from '../types';
import { CloudError, isRecord, readJson } from './error';

const UPLOAD_FAILED = 'The upload failed. Try again.';
const TOO_MANY = 'Too many uploads right now. Try again in a minute.';
const REUSE_FOR = 60 * 60 * 1000;

interface UploadTicket {
  id: string;
  url: string;
  method: string;
  headers: Record<string, string>;
}

export type Send = (url: string, init: CloudRequestInit, timeout: number) => Promise<CloudResponse>;

class UploadError extends Error {}

function isFile(value: unknown): value is CloudFile {
  return isRecord(value) && typeof value.name === 'string' && typeof value.size === 'number' && typeof value.arrayBuffer === 'function';
}

function fileKeys(nodes: FormNode[] = []): string[] {
  return nodes.flatMap((node) =>
    node.type === 'section' ? fileKeys((node as { fields: FormNode[] }).fields) : node.type === 'file' ? [node.key] : [],
  );
}

async function refusal(response: CloudResponse): Promise<string> {
  if (response.status === 429) return TOO_MANY;
  const body: unknown = await response.json().catch(() => null);
  return isRecord(body) && typeof body.message === 'string' ? body.message : UPLOAD_FAILED;
}

async function uploadFile(endpoint: string, send: Send, field: string, file: CloudFile): Promise<string> {
  const response = await send(
    endpoint,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ field, name: file.name, size: file.size }),
    },
    15_000,
  );
  if (!response.ok) throw new UploadError(await refusal(response));
  const ticket = (await readJson(response)) as UploadTicket;
  const stored = await send(ticket.url, { method: ticket.method, headers: ticket.headers, body: file }, 120_000);
  if (!stored.ok) throw new UploadError(UPLOAD_FAILED);
  return ticket.id;
}

export function createUploader(endpoint: string, send: Send, now: () => number = Date.now) {
  const uploaded = new WeakMap<CloudFile, { id: string; at: number }>();
  const reusable = (file: CloudFile) => {
    const known = uploaded.get(file);
    return known && now() - known.at < REUSE_FOR ? known.id : undefined;
  };
  return {
    async upload(definition: FormDefinition, values: Record<string, unknown>): Promise<Record<string, unknown>> {
      const sent = { ...values };
      const errors: Record<string, string> = {};
      const keys = fileKeys([...(definition.fields ?? []), ...(definition.steps ?? []).flatMap((step) => step.fields)]);
      await Promise.all(
        keys.map(async (key) => {
          const file = values[key];
          if (!isFile(file)) return;
          try {
            let id = reusable(file);
            if (id === undefined) {
              id = await uploadFile(endpoint, send, key, file);
              uploaded.set(file, { id, at: now() });
            }
            sent[key] = id;
          } catch (error) {
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

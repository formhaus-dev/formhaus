import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { CloudError, createSubmitter, fetchForm } from '../../src/cloud';

interface Row {
  name: string;
  request: 'load' | 'submit';
  response: { status: number; headers?: Record<string, string>; body: unknown };
  expect: { submission?: unknown; form?: unknown; error?: { status: number; code: string; action: string | null; version?: number; errors?: Record<string, string> } };
}

const rows: Row[] = JSON.parse(readFileSync(join(__dirname, '../../fixtures/cloud/responses.json'), 'utf8'));

afterEach(() => vi.unstubAllGlobals());

describe('cloud contract fixtures', () => {
  it.each(rows.map((row) => [row.name, row] as const))('%s', async (_, row) => {
    const { status, headers = {}, body } = row.response;
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: status < 400, status, headers: { get: (name: string) => headers[name] ?? null }, json: async () => body }));
    const run = row.request === 'load' ? fetchForm({ id: 'abc' }) : createSubmitter({ id: 'abc' })({ email: 'ada@example.com' });
    if (!row.expect.error) {
      await expect(run).resolves.toEqual(row.expect.submission ?? row.expect.form);
      return;
    }
    const error = await run.then(() => null, (thrown: unknown) => thrown);
    expect(error).toBeInstanceOf(CloudError);
    const { version, errors, ...rest } = row.expect.error;
    expect(error).toMatchObject({ ...rest, ...(version !== undefined && { version }), ...(errors && { errors }) });
  });
});

const DEFAULT_API_BASE = 'https://api.formhaus.dev';
const REQUEST_TIMEOUT_MS = 15000;

export interface CloudResult {
  ok: boolean;
  body: unknown;
}

export function apiKey(): string | undefined {
  return process.env.FORMHAUS_API_KEY?.trim() || undefined;
}

export async function cloudRequest(path: string, init: { method?: string; body?: unknown; auth: 'required' | 'optional' }): Promise<CloudResult> {
  const key = apiKey();
  if (init.auth === 'required' && !key) {
    return { ok: false, body: { error: 'FORMHAUS_API_KEY is not set. Create an API key in the Formhaus dashboard and set it in the MCP server environment.' } };
  }
  const base = (process.env.FORMHAUS_API_BASE || DEFAULT_API_BASE).replace(/\/+$/, '');
  try {
    const response = await fetch(`${base}${path}`, {
      method: init.method ?? 'GET',
      headers: {
        Accept: 'application/json',
        ...(init.body !== undefined && { 'Content-Type': 'application/json' }),
        ...(key && { Authorization: `Bearer ${key}` }),
      },
      body: init.body === undefined ? undefined : JSON.stringify(init.body),
      signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
    });
    const body: unknown = await response.json().catch(() => ({ error: `Unexpected response (HTTP ${response.status}).` }));
    return { ok: response.ok, body };
  } catch (error) {
    return { ok: false, body: { error: `Could not reach Formhaus Cloud: ${(error as Error).message}` } };
  }
}

import { failureFor, type CloudAction } from './failures';

export class CloudError extends Error {
  readonly status: number;
  readonly code: string;
  readonly errors?: Record<string, string>;
  readonly version?: number;
  readonly action: CloudAction;
  readonly cause?: unknown;

  constructor(status: number, code: string, errors?: Record<string, string>, version?: number, cause?: unknown) {
    const failure = failureFor(status, code);
    super(failure.message);
    this.name = 'CloudError';
    this.status = status;
    this.code = code;
    this.errors = errors;
    this.version = version;
    this.action = failure.action;
    this.cause = cause;
  }

  get retryable(): boolean {
    return this.action === 'retry';
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

const LEGACY_CODES = new Map([
  ['Form paused', 'paused'],
  ['Form not found', 'not_found'],
  ['Form expired', 'expired'],
  ['internal error', 'internal'],
]);

export function networkError(cause: unknown, code = 'network'): CloudError {
  return new CloudError(0, code, undefined, undefined, cause);
}

export async function readJson(response: CloudResponse): Promise<unknown> {
  try {
    return await response.json();
  } catch (error) {
    throw new CloudError(response.status, 'invalid_response', undefined, undefined, error);
  }
}

export async function toCloudError(response: CloudResponse): Promise<CloudError> {
  const body: unknown = await response.json().catch(() => null);
  if (!isRecord(body)) return new CloudError(response.status, 'unknown');
  const errors = isRecord(body.errors) ? body.errors as Record<string, string> : undefined;
  const version = typeof body.version === 'number' && Number.isInteger(body.version) ? body.version : undefined;
  const code = typeof body.error === 'string' ? LEGACY_CODES.get(body.error) ?? body.error : 'unknown';
  return new CloudError(response.status, code, errors, version);
}

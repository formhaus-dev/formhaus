import { failureFor, type CloudAction, type KnownCloudErrorCode } from './failures';

export interface CloudErrorInit {
  status: number;
  code: KnownCloudErrorCode | (string & {});
  errors?: Record<string, string>;
  version?: number;
  cause?: unknown;
}

export class CloudError extends Error {
  readonly status: number;
  readonly code: KnownCloudErrorCode | (string & {});
  readonly errors?: Record<string, string>;
  readonly version?: number;
  readonly action: CloudAction;
  readonly cause?: unknown;

  constructor({ status, code, errors, version, cause }: CloudErrorInit) {
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

export function isRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

const LEGACY_CODES = new Map([
  ['Form paused', 'paused'],
  ['Form not found', 'not_found'],
  ['Form expired', 'expired'],
  ['internal error', 'internal'],
]);

export function networkError(cause: unknown, code: KnownCloudErrorCode = 'network'): CloudError {
  return new CloudError({ status: 0, code, cause });
}

export async function readJson(response: CloudResponse): Promise<unknown> {
  try {
    return await response.json();
  } catch (error) {
    throw new CloudError({ status: response.status, code: 'invalid_response', cause: error });
  }
}

export async function toCloudError(response: CloudResponse): Promise<CloudError> {
  const body: unknown = await response.json().catch(() => null);
  if (!isRecord(body)) return new CloudError({ status: response.status, code: 'unknown' });
  const errors = isRecord(body.errors) ? (body.errors as Record<string, string>) : undefined;
  const version = typeof body.version === 'number' && Number.isInteger(body.version) ? body.version : undefined;
  const code = typeof body.error === 'string' ? (LEGACY_CODES.get(body.error) ?? body.error) : 'unknown';
  return new CloudError({ status: response.status, code, errors, version });
}

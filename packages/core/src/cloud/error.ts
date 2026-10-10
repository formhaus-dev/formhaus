const MESSAGES: Record<number, string> = {
  422: 'Some answers were not accepted. Check the highlighted fields.',
  402: 'This form cannot accept submissions right now.',
  409: 'This form is not accepting submissions.',
  410: 'This form no longer accepts submissions.',
  429: 'Too many submissions. Try again shortly.',
};

export class CloudError extends Error {
  readonly status: number;
  readonly code: string;
  readonly errors?: Record<string, string>;

  constructor(status: number, code: string, errors?: Record<string, string>) {
    super(MESSAGES[status] ?? 'Request failed. Try again.');
    this.name = 'CloudError';
    this.status = status;
    this.code = code;
    this.errors = errors;
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

export async function toCloudError(response: CloudResponse): Promise<CloudError> {
  const body: unknown = await response.json().catch(() => null);
  if (!isRecord(body)) return new CloudError(response.status, 'unknown');
  const errors = isRecord(body.errors) ? body.errors as Record<string, string> : undefined;
  return new CloudError(response.status, typeof body.error === 'string' ? body.error : 'unknown', errors);
}

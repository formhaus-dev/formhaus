export type CloudAction = 'retry' | 'reload' | null;

export interface CloudFailure {
  message: string;
  action: CloudAction;
}

export const FORM_UPDATED_MESSAGE = 'This form was updated. Please review your answers and submit again.';
export const INVALID_MESSAGE = 'Some answers were not accepted.';

const OFFLINE: CloudFailure = { message: 'You seem to be offline. Your answers are kept; check the connection and try again.', action: 'retry' };
const SERVER: CloudFailure = { message: 'Something went wrong on our side. Your answers are kept; try again.', action: 'retry' };
const GENERIC: CloudFailure = { message: 'Could not send your answers. Try again.', action: 'retry' };
const BROKEN: CloudFailure = { message: 'Your answers could not be sent. Reload the page and try again.', action: 'reload' };

const BY_CODE: Record<string, CloudFailure> = {
  network: OFFLINE,
  invalid: { message: INVALID_MESSAGE, action: null },
  rate_limited: { message: 'Too many attempts. Wait a minute, then try again.', action: 'retry' },
  limit_reached: { message: 'This form is not accepting more responses right now.', action: null },
  not_found: { message: 'This form no longer exists.', action: null },
  paused: { message: 'This form is paused. The owner is not accepting responses right now.', action: null },
  expired: { message: 'This form has expired and no longer accepts responses.', action: null },
  body_too_large: { message: 'Your answers are too long to send. Shorten the longest answer and send again.', action: null },
  idempotency_key_reused: { message: 'Your answers changed while they were being sent. Send them again.', action: 'retry' },
  form_updated: { message: 'This form was updated. Reload the page to see the new version.', action: 'reload' },
  malformed_body: BROKEN,
  unsupported_media_type: BROKEN,
  invalid_idempotency_key: BROKEN,
  unavailable: SERVER,
  internal: SERVER,
};

const CODE_BY_STATUS: Record<number, string> = {
  0: 'network',
  400: 'malformed_body',
  402: 'limit_reached',
  404: 'not_found',
  410: 'expired',
  413: 'body_too_large',
  422: 'invalid',
  423: 'paused',
  429: 'rate_limited',
};

export function failureFor(status: number, code = ''): CloudFailure {
  const known = BY_CODE[code] ?? BY_CODE[CODE_BY_STATUS[status] ?? ''];
  if (known) return known;
  return status >= 500 ? SERVER : GENERIC;
}

export type CloudAction = 'retry' | 'reload' | null;

export interface CloudFailure {
  message: string;
  action: CloudAction;
}

export const FORM_UPDATED_MESSAGE = 'This form was updated. Please review your answers and submit again.';
export const ANSWER_AGAIN = 'Please answer again.';

const SERVER: CloudFailure = { message: 'Something went wrong. Try again.', action: 'retry' };
const GENERIC: CloudFailure = { message: 'Could not send. Try again.', action: 'retry' };
const BROKEN: CloudFailure = { message: 'Could not send. Reload the page and try again.', action: 'reload' };

const BY_CODE: Record<string, CloudFailure> = {
  network: { message: 'You are offline. Check your connection and try again.', action: 'retry' },
  invalid: { message: 'Some answers were not accepted.', action: null },
  rate_limited: { message: 'Too many attempts. Wait a minute and try again.', action: 'retry' },
  limit_reached: { message: 'This form is not accepting responses right now.', action: null },
  not_found: { message: 'This form no longer exists.', action: null },
  paused: { message: 'This form is paused.', action: null },
  expired: { message: 'This form has expired.', action: null },
  body_too_large: { message: 'Your answers are too long. Shorten them and try again.', action: null },
  idempotency_key_reused: { message: 'Your answers changed while sending. Try again.', action: 'retry' },
  form_updated: { message: 'This form was updated. Reload the page.', action: 'reload' },
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
  429: 'rate_limited',
};

export function failureFor(status: number, code = ''): CloudFailure {
  const known = BY_CODE[code] ?? BY_CODE[CODE_BY_STATUS[status] ?? ''];
  if (known) return known;
  return status >= 500 ? SERVER : GENERIC;
}

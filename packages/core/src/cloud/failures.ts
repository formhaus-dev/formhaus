export type CloudAction = 'retry' | 'reload' | null;

export type KnownCloudErrorCode =
  | 'network'
  | 'timeout'
  | 'invalid'
  | 'rate_limited'
  | 'limit_reached'
  | 'not_found'
  | 'paused'
  | 'expired'
  | 'body_too_large'
  | 'idempotency_key_reused'
  | 'form_updated'
  | 'file_taken'
  | 'origin_not_allowed'
  | 'client_outdated'
  | 'verification_failed'
  | 'verification_timeout'
  | 'verification_required'
  | 'malformed_body'
  | 'unsupported_media_type'
  | 'invalid_idempotency_key'
  | 'invalid_response'
  | 'unavailable'
  | 'internal'
  | 'unknown';

export type CloudNoticeActionFn = (action: NonNullable<CloudAction>) => void;

export type CloudNoticeCode = KnownCloudErrorCode | 'form_refreshed';

export type CloudLabelKey = CloudNoticeCode | 'retry' | 'reload' | 'submitAnother' | 'submitted';

export type CloudLabelSource = Partial<Record<CloudLabelKey, string>> | ((key: CloudLabelKey) => string | undefined);

interface CloudText {
  message: string;
  action: CloudAction;
}

export interface CloudFailure extends CloudText {
  code: CloudNoticeCode;
}

export const FORM_UPDATED_MESSAGE = 'This form was updated. Please review your answers and submit again.';
export const ANSWER_AGAIN = 'Please answer again.';

const SERVER: CloudText = { message: 'Something went wrong. Try again.', action: 'retry' };
const GENERIC: CloudText = { message: 'Could not send. Try again.', action: 'retry' };
const BROKEN: CloudText = { message: 'Could not send. Reload the page and try again.', action: 'reload' };

const MESSAGES = {
  network: { message: 'Could not reach the form server. Check your connection and try again.', action: 'retry' },
  timeout: { message: 'The form server did not respond. Try again.', action: 'retry' },
  invalid: { message: 'Some answers were not accepted.', action: null },
  rate_limited: { message: 'Too many attempts. Wait a minute and try again.', action: 'retry' },
  limit_reached: { message: 'This form is not accepting responses right now.', action: null },
  not_found: { message: 'This form no longer exists.', action: null },
  paused: { message: 'This form is paused.', action: null },
  expired: { message: 'This form has expired.', action: null },
  body_too_large: { message: 'Your answers are too long. Shorten them and try again.', action: null },
  idempotency_key_reused: { message: 'Your answers changed while sending. Try again.', action: 'retry' },
  form_updated: { message: 'This form was updated. Reload the page.', action: 'reload' },
  file_taken: { message: 'A file is no longer available. Upload it again and send.', action: null },
  origin_not_allowed: { message: 'This form is not available on this site.', action: null },
  client_outdated: { message: 'This form needs a newer version of this page.', action: null },
  verification_failed: { message: 'The bot check did not pass. Submit again to retry.', action: 'retry' },
  verification_timeout: { message: 'The bot check took too long. Submit again to retry.', action: 'retry' },
  verification_required: { message: 'This form needs a bot check. Reload the page and try again.', action: 'reload' },
  malformed_body: BROKEN,
  unsupported_media_type: BROKEN,
  invalid_idempotency_key: BROKEN,
  invalid_response: SERVER,
  unavailable: SERVER,
  internal: SERVER,
} satisfies Record<Exclude<KnownCloudErrorCode, 'unknown'>, CloudText>;

const BY_CODE: Record<string, CloudText | undefined> = MESSAGES;

const CODE_BY_STATUS: Record<number, KnownCloudErrorCode> = {
  0: 'network',
  400: 'malformed_body',
  402: 'limit_reached',
  404: 'not_found',
  409: 'paused',
  410: 'expired',
  413: 'body_too_large',
  422: 'invalid',
  426: 'client_outdated',
  429: 'rate_limited',
};

export const unknownFailure = (): CloudFailure => ({ ...GENERIC, code: 'unknown' });

export function failureFor(status: number, code = ''): CloudFailure {
  const known = BY_CODE[code] ? code : CODE_BY_STATUS[status];
  if (known) return { ...BY_CODE[known]!, code: known as CloudNoticeCode };
  return status >= 500 ? { ...SERVER, code: 'unknown' } : unknownFailure();
}

const CLOUD_LABELS: Partial<Record<CloudLabelKey, string>> = {
  retry: 'Try again',
  reload: 'Reload page',
  submitAnother: 'Submit another response',
  submitted: 'Thank you. Your response was submitted.',
};

export const CLOUD_NOTICE = '[data-fh-notice], .fh-form__notice';

export function cloudLabel(labels: CloudLabelSource | undefined, key: CloudLabelKey, fallback = CLOUD_LABELS[key]!): string {
  const text = typeof labels === 'function' ? labels(key) : labels?.[key];
  return typeof text === 'string' && text ? text : fallback;
}

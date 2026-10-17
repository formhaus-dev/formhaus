import type { FormDefinition } from '../types';
import { CloudError, isRecord } from './error';

export interface CloudSettings {
  successMessage?: string;
  redirectUrl?: string;
  allowAnother?: boolean;
}

export interface CloudChallenge {
  provider: string;
  siteKey: string;
  url: string;
}

export interface PublishedForm {
  definition: FormDefinition;
  version?: number;
  settings?: CloudSettings;
  renderToken?: string;
  challenge?: CloudChallenge;
}

const VERSION_HEADERS = ['Formhaus-Form-Version', 'Formhaus-Version'];

function toVersion(value: unknown): number | undefined {
  const version = Number(value);
  return value !== null && value !== '' && Number.isInteger(version) && version > 0 ? version : undefined;
}

function headerVersion(response: CloudResponse): number | undefined {
  for (const name of VERSION_HEADERS) {
    const version = toVersion(response.headers?.get(name));
    if (version !== undefined) return version;
  }
  return undefined;
}

function text(value: unknown): string | undefined {
  return typeof value === 'string' && value !== '' ? value : undefined;
}

function isHttp(value: unknown): value is string {
  return typeof value === 'string' && /^https?:\/\//i.test(value);
}

export function parseSettings(value: unknown): CloudSettings {
  if (!isRecord(value)) return {};
  const redirect = text(value.redirectUrl);
  return {
    ...(text(value.successMessage) && { successMessage: text(value.successMessage) }),
    ...(isHttp(redirect) && { redirectUrl: redirect }),
    ...(typeof value.allowAnother === 'boolean' && { allowAnother: value.allowAnother }),
  };
}

export function parseForm(body: unknown, response: CloudResponse): PublishedForm {
  if (!isRecord(body)) throw new CloudError(response.status, 'invalid_response');
  if (!('definition' in body)) return { definition: body as unknown as FormDefinition, version: headerVersion(response), settings: {} };
  if (!isRecord(body.definition)) throw new CloudError(response.status, 'invalid_response');
  return {
    definition: body.definition as unknown as FormDefinition,
    version: toVersion(body.version) ?? headerVersion(response),
    settings: parseSettings(body.settings),
    ...(text(body.renderToken) && { renderToken: text(body.renderToken) }),
    ...(isRecord(body.challenge) && isHttp(body.challenge.url) && { challenge: body.challenge as unknown as CloudChallenge }),
  };
}

import type { SubmitResult } from '@formhaus/core';
import type { AccountRequest, ApiResponse, MockApi } from './api';

const apiKeys: Record<string, keyof AccountRequest> = {
  firstName: 'first_name',
  lastName: 'last_name',
  email: 'email',
  accountType: 'account_type',
  companyName: 'company_name',
  street: 'street',
  postcode: 'postal_code',
};

const formKeys = Object.fromEntries(Object.entries(apiKeys).map(([form, api]) => [api, form]));

export function toRequest(values: Record<string, unknown>): AccountRequest {
  const request: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(values)) request[apiKeys[key] ?? key] = value;
  return request as unknown as AccountRequest;
}

export function toResult(response: ApiResponse): SubmitResult {
  if (response.status < 400) return { ok: true };
  const message = response.body.message ?? 'The server could not save your account';
  if (response.status !== 422 || !response.body.errors) return { ok: false, formErrors: [message] };
  const errors: Record<string, string> = {};
  for (const [key, messages] of Object.entries(response.body.errors)) errors[formKeys[key] ?? key] = messages.join(' ');
  return { ok: false, errors };
}

export function submitTo(api: MockApi) {
  return async (values: Record<string, unknown>): Promise<SubmitResult> => toResult(await api.createAccount(toRequest(values)));
}

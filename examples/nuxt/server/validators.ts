import type { ValidatorFn } from '@formhaus/core';
import { definition } from '~~/shared/definition';

const takenCompanies = new Set(['acme']);

const serverValidators: Record<string, ValidatorFn> = {
  companyAvailable: (value) => (takenCompanies.has(String(value).trim().toLowerCase()) ? 'This company already has a workspace' : null),
};

export function runServerValidators(values: Record<string, unknown>, errors: Record<string, string>) {
  const fields = definition.steps?.flatMap((step) => step.fields) ?? definition.fields ?? [];
  for (const field of fields) {
    const validate = serverValidators[field.validation?.validator ?? ''];
    const value = values[field.key];
    if (!validate || errors[field.key] || value === undefined || value === '') continue;
    const error = validate(value, values);
    if (error) errors[field.key] = error;
  }
}

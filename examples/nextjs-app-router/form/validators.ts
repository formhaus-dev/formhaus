import type { ValidatorFn } from '@formhaus/core';

const takenCompanies = new Set(['acme']);

export const serverValidators: Record<string, ValidatorFn> = {
  companyAvailable: (value) =>
    takenCompanies.has(String(value).trim().toLowerCase()) ? 'This company already has a workspace' : null,
};

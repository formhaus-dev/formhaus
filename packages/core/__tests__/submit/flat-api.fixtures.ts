import fixture from '../../fixtures/conformance/flat-api-steps.json';
import type { FormDefinition } from '../../src';

export const flatApi = fixture.definition as FormDefinition;

export const valid = {
  firstName: 'Ada',
  lastName: 'Lovelace',
  email: 'ada@example.com',
  accountType: 'personal',
  street: '1 Main St',
  postcode: '10115',
};

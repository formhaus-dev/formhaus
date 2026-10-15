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

export function deferred<T = void>() {
  let resolve!: (value: T) => void;
  let reject!: (error: unknown) => void;
  const promise = new Promise<T>((done, fail) => {
    resolve = done;
    reject = fail;
  });
  return { promise, resolve, reject };
}

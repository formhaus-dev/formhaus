import type { FormActionsView, TestIdTarget } from '../types';

export type TestIdOption = boolean | ((target: TestIdTarget) => string | undefined);
export type TestId = (kind: TestIdTarget['kind'], key?: string, value?: string) => string | undefined;

export function testIds(option: TestIdOption | undefined, definitionId: string): TestId | undefined {
  if (!option) return undefined;
  return (kind, key, value) =>
    option === true
      ? `${definitionId}.${key ?? kind}${value === undefined ? '' : `.${value}`}`
      : option({ kind, definitionId, key, value } as TestIdTarget);
}

export const fieldTestIds = (testId: TestId | undefined, key: string) => ({
  testId: testId?.('field', key),
  optionTestId: testId && ((value: string) => testId('option', key, value)),
});

export const actionTestIds = (testId: TestId | undefined): FormActionsView['testIds'] =>
  testId && Object.fromEntries((['submit', 'next', 'back'] as const).map((kind) => [kind, testId(kind)]));

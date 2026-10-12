import { checkDefinition } from './check-definition';

export function validateDefinition(input: unknown): string[] {
  return checkDefinition(input).map((issue) => issue.message);
}

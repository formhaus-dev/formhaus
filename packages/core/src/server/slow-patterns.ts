import type { FormDefinition } from '../types';
import { createContext } from '../definition-validation/context';
import { error, FormDefinitionError, withTexts } from '../definition-validation/issues';
import { slowPattern } from '../definition-validation/slow-pattern';
import { ISSUE_TEXTS } from '../definition-validation/texts';

const checked = new Map<string, boolean>();

function isSlow(pattern: string): boolean {
  if (pattern.length > 1000) return true;
  const cached = checked.get(pattern);
  if (cached !== undefined) return cached;
  const kind = slowPattern(pattern);
  const slow = !!kind && kind !== 'quadratic';
  if (checked.size >= 256) checked.clear();
  checked.set(pattern, slow);
  return slow;
}

export function refuseSlowPatterns(definition: FormDefinition): void {
  const issues = withTexts(ISSUE_TEXTS, () =>
    createContext(definition).entries.flatMap(({ field, path }) => {
      const pattern = field.validation?.pattern;
      return typeof pattern === 'string' && isSlow(pattern) ? [error('slow-pattern', `${path}/validation/pattern`, field.key)] : [];
    }),
  );
  if (issues.length) throw new FormDefinitionError(issues);
}

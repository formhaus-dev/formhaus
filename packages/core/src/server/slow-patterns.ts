import type { FormDefinition } from '../types';
import { createContext } from '../definition-validation/context';
import { error, FormDefinitionError, withTexts } from '../definition-validation/issues';
import { slowPattern } from '../definition-validation/slow-pattern';
import { ISSUE_TEXTS } from '../definition-validation/texts';
import { isQuadratic } from './quadratic-pattern';

const QUADRATIC_VALUE_LENGTH = 1000;

type Verdict = 'refused' | 'quadratic' | 'safe';

const verdicts = new Map<string, Verdict>();

function judge(pattern: string): Verdict {
  if (!slowPattern(pattern)) return 'safe';
  return isQuadratic(pattern) ? 'quadratic' : 'refused';
}

function verdict(pattern: string): Verdict {
  if (pattern.length > 1000) return 'refused';
  const cached = verdicts.get(pattern);
  if (cached) return cached;
  const result = judge(pattern);
  if (verdicts.size >= 256) verdicts.clear();
  verdicts.set(pattern, result);
  return result;
}

const LIMITS: Record<Verdict, number | undefined> = { refused: 0, quadratic: QUADRATIC_VALUE_LENGTH, safe: undefined };

export const quadraticLimit = (pattern: string): number | undefined => LIMITS[verdict(pattern)];

export function refuseSlowPatterns(definition: FormDefinition): void {
  const issues = withTexts(ISSUE_TEXTS, () =>
    createContext(definition).entries.flatMap(({ field, path }) => {
      const pattern = field.validation?.pattern;
      return typeof pattern === 'string' && verdict(pattern) === 'refused'
        ? [error('slow-pattern', `${path}/validation/pattern`, field.key)]
        : [];
    }),
  );
  if (issues.length) throw new FormDefinitionError(issues);
}

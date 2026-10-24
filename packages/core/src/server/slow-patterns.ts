import type { FormDefinition } from '../types';
import { createContext } from '../definition-validation/context';
import { error, FormDefinitionError, withTexts } from '../definition-validation/issues';
import { scanPattern } from '../definition-validation/slow-pattern';
import { ISSUE_TEXTS } from '../definition-validation/texts';

const QUADRATIC_VALUE_LENGTH = 1000;

const UNSAFE_FOR_QUADRATIC = /\||\(\?<?[=!]|\)[?*]|\{0[,}]|\\[1-9k]/;

type Verdict = 'refused' | 'quadratic' | 'safe';

const verdicts = new Map<string, Verdict>();

function judge(pattern: string): Verdict {
  const { slow, overlaps, optionalOverlaps, fixedOverlaps } = scanPattern(pattern);
  if (!slow) return 'safe';
  const quadratic =
    slow === 'adjacent' &&
    overlaps === 1 &&
    optionalOverlaps <= 1 &&
    fixedOverlaps === 0 &&
    pattern.startsWith('^') &&
    !UNSAFE_FOR_QUADRATIC.test(pattern);
  return quadratic ? 'quadratic' : 'refused';
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

export const quadraticLimit = (pattern: string): number | undefined =>
  verdict(pattern) === 'quadratic' ? QUADRATIC_VALUE_LENGTH : undefined;

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

import type { CheckContext } from './context';
import type { DefinitionIssue } from './issues';
import { warning } from './issues';
import { exclusiveValues } from '../validation/type-checks';

export function exclusiveWarnings({ entries }: CheckContext): DefinitionIssue[] {
  return entries.flatMap(({ field, path }) => {
    const { key, options = [], defaultValue, validation } = field;
    const exclusive = exclusiveValues(field);
    const issues = options.flatMap(({ value, exclusive: flag }, index) =>
      !flag
        ? []
        : !exclusive.length
          ? [
              warning(
                'exclusive-not-applicable',
                `${path}/options/${index}/exclusive`,
                `"exclusive" on "${value}" in "${key}" needs a multiselect with static options`,
                'Remove "exclusive"',
              ),
            ]
          : options.slice(index + 1).some((next) => !next.exclusive)
            ? [
                warning(
                  'exclusive-option-position',
                  `${path}/options/${index}`,
                  `the exclusive option "${value}" in "${key}" is not last`,
                  'Move exclusive options to the end',
                ),
              ]
            : [],
    );
    const mixed = Array.isArray(defaultValue) && defaultValue.length > 1 && defaultValue.find((value) => exclusive.includes(value));
    if (mixed)
      issues.push(
        warning(
          'exclusive-default-value',
          `${path}/defaultValue`,
          `the default of "${key}" mixes the exclusive option "${mixed}" with others`,
          'Keep the exclusive option alone',
        ),
      );
    if (exclusive.length && (validation?.minLength ?? 0) > 1)
      issues.push(
        warning(
          'exclusive-with-min-length',
          `${path}/validation/minLength`,
          `"${key}" has an exclusive option, so "minLength" does not apply to it`,
          'Remove "minLength"',
        ),
      );
    return issues;
  });
}

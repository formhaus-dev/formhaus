import type { CheckContext } from './context';
import type { DefinitionIssue } from './issues';
import { warning } from './issues';
import { exclusiveValues } from '../validation/type-checks';

export function exclusiveWarnings({ entries }: CheckContext): DefinitionIssue[] {
  return entries.flatMap(({ field, path }) => {
    const { key, defaultValue, validation } = field;
    const options = field.options ?? [];
    const exclusive = exclusiveValues(field);
    const at = (index: number) => `${path}/options/${index}`;
    if (!exclusive.length)
      return options.flatMap((option, index) =>
        option.exclusive
          ? [warning('exclusive-not-applicable', `${at(index)}/exclusive`, `"${key}" is not a multiselect with static options`)]
          : [],
      );
    const first = options.findIndex((option) => option.exclusive);
    const defaults = Array.isArray(defaultValue) && defaultValue.length > 1 ? defaultValue : [];
    return [
      ...(options.slice(first).some((option) => !option.exclusive)
        ? [warning('exclusive-option-position', at(first), `exclusive options of "${key}" are not last`)]
        : []),
      ...(defaults.some((value) => exclusive.includes(value))
        ? [warning('exclusive-default-value', `${path}/defaultValue`, `the default of "${key}" mixes exclusive and other options`)]
        : []),
      ...((validation?.minLength ?? 0) > 1
        ? [
            warning(
              'exclusive-with-min-length',
              `${path}/validation/minLength`,
              `"minLength" does not apply to an exclusive option of "${key}"`,
            ),
          ]
        : []),
    ];
  });
}

import type { FormField } from '../types';
import { hasOwn } from '../visibility/nodes';
import { BOOLEAN_TYPES, BUILT_IN_TYPES, LIST_TYPES, NUMBER_TYPES, SCALE_TYPES } from '../validation/type-checks';
import { conditionErrors, missingTarget, OPERATORS } from './conditions';
import type { CheckContext, ConditionEntry, FieldEntry } from './context';
import type { DefinitionIssue } from './issues';
import { closest, oneOf, warning } from './issues';
import { propertyWarnings } from './properties';
import { sourceWarnings } from './sources';

const LIST_OPERATORS = ['in', 'notIn'];
const COMPARISONS = ['gt', 'gte', 'lt', 'lte'];

function expectedType(field: FormField): string | undefined {
  if (NUMBER_TYPES.includes(field.type)) return 'number';
  if (BOOLEAN_TYPES.includes(field.type)) return 'boolean';
  return BUILT_IN_TYPES.includes(field.type) && !LIST_TYPES.includes(field.type) && field.type !== 'file' ? 'string' : undefined;
}

function valueIssue(target: FormField, operator: string, operand: unknown, path: string): DefinitionIssue[] {
  const mismatch = (problem: string, hint: string) => [warning('condition-value-mismatch', path, problem, hint)];
  if (operator === 'notEmpty')
    return operand
      ? []
      : [warning('condition-always-true', path, '"notEmpty": false matches every value', 'Use "notEmpty": true, or remove the condition')];
  if (COMPARISONS.includes(operator)) {
    if (!LIST_TYPES.includes(target.type) && !BOOLEAN_TYPES.includes(target.type)) return [];
    return mismatch(
      `"${target.key}" is a ${target.type} field, so "${operator}" never matches it`,
      'Compare a number, text, radio or select field',
    );
  }
  if (LIST_TYPES.includes(target.type)) {
    const result = operator === 'neq' || operator === 'notIn' ? 'always' : 'never';
    return mismatch(
      `"${target.key}" holds a list of values, so "${operator}" ${result} matches it`,
      'Use notEmpty, or a select or radio field',
    );
  }
  const operands = LIST_OPERATORS.includes(operator) && Array.isArray(operand) ? operand : [operand];
  const expected = expectedType(target);
  const wrong = expected && operands.find((item) => typeof item !== expected);
  if (expected && wrong !== undefined)
    return mismatch(`${JSON.stringify(wrong)} is a ${typeof wrong}, but "${target.key}" holds a ${expected}`, `Use a ${expected} value`);
  const options =
    expected === 'string' && !target.optionsFrom && target.options?.length ? target.options.map((option) => option.value) : null;
  const missing = options && operands.find((item) => !options.includes(item as string));
  return options && missing !== undefined ? mismatch(`${JSON.stringify(missing)} is not an option of "${target.key}"`, oneOf(options)) : [];
}

function conditionWarnings(context: CheckContext, entry: ConditionEntry): DefinitionIssue[] {
  const { condition, path } = entry;
  if (conditionErrors(context, entry).length) return [];
  const operator = OPERATORS.find((key) => key in condition)!;
  return valueIssue(
    context.target(condition.field, entry.group)!.field,
    operator,
    condition[operator as keyof typeof condition],
    `${path}/${operator}`,
  );
}

function optionIssues({ field, path }: FieldEntry): DefinitionIssue[] {
  if (!['select', 'radio', 'multiselect'].includes(field.type)) return [];
  if (!Array.isArray(field.options)) {
    return field.optionsFrom
      ? []
      : [
          warning(
            'missing-options',
            `${path}/options`,
            `the ${field.type} field "${field.key}" has no options`,
            'Add "options" or "optionsFrom"',
          ),
        ];
  }
  const values = field.options.map((option) => option.value);
  const defaults = field.type === 'multiselect' && Array.isArray(field.defaultValue) ? field.defaultValue : [field.defaultValue];
  const missing =
    field.defaultValue === undefined || !values.length || field.optionsFrom
      ? undefined
      : defaults.find((value) => !values.includes(value as string));
  if (missing === undefined) return [];
  return [
    warning(
      'default-not-in-options',
      `${path}/defaultValue`,
      `${JSON.stringify(missing)} is not an option of "${field.key}"`,
      oneOf(values),
    ),
  ];
}

function slowPattern(pattern: string): boolean {
  const groups: boolean[] = [];
  let closed = false;
  for (let index = 0; index < pattern.length && pattern.length <= 1000; index++) {
    const char = pattern[index];
    if (closed && '*+{'.includes(char)) return true;
    closed = false;
    if (char === '\\') index++;
    else if (char === '[') {
      for (index++; index < pattern.length && pattern[index] !== ']'; index++) if (pattern[index] === '\\') index++;
    } else if (char === '(') {
      groups.push(false);
      if (pattern[index + 1] === '?') index++;
    } else if (char === ')') {
      closed = !!groups.pop();
      if (closed && groups.length) groups[groups.length - 1] = true;
    } else if (groups.length && '*+?|{'.includes(char)) groups[groups.length - 1] = true;
  }
  return false;
}

function ruleWarnings(context: CheckContext, { field, path }: FieldEntry): DefinitionIssue[] {
  const rules = field.validation ?? {};
  const rule = (name: string, problem: string, hint: string) => warning('rule-not-applicable', `${path}/validation/${name}`, problem, hint);
  const items = field.type === 'group';
  const known = items || BUILT_IN_TYPES.includes(field.type);
  const numeric = NUMBER_TYPES.includes(field.type);
  const ranges = known && !numeric ? (['min', 'max'] as const).filter((name) => rules[name] !== undefined) : [];
  const sized =
    known && [...NUMBER_TYPES, ...BOOLEAN_TYPES].includes(field.type)
      ? (['minLength', 'maxLength'] as const).filter((name) => rules[name] !== undefined)
      : [];
  const issues = [
    ...ranges.map((name) =>
      rule(name, `"${name}" applies to number fields only`, `Use ${name}Length to limit ${items ? 'the number of items' : 'text length'}`),
    ),
    ...sized.map((name) =>
      rule(name, `"${name}" does not apply to ${field.type} fields`, numeric ? 'Use min and max for numbers' : `Remove ${name}`),
    ),
  ];
  if (typeof rules.pattern === 'string' && slowPattern(rules.pattern)) {
    issues.push(
      warning(
        'slow-pattern',
        `${path}/validation/pattern`,
        `the pattern of "${field.key}" nests quantifiers and can be very slow`,
        'Remove the inner or outer quantifier',
      ),
    );
  }
  const { validators } = context;
  if (rules.validator !== undefined && validators && !hasOwn(validators, rules.validator)) {
    issues.push(
      warning(
        'unknown-validator',
        `${path}/validation/validator`,
        `the validator "${rules.validator}" is not registered`,
        'Pass it in the "validators" option',
      ),
    );
  }
  return issues;
}

function fieldWarnings(context: CheckContext, entry: FieldEntry): DefinitionIssue[] {
  const { field, path } = entry;
  const custom = !BUILT_IN_TYPES.includes(field.type) && field.type !== 'group';
  const named = /[-:]/.test(field.type);
  const spelled = named ? field.type.replace(/[-_:]/g, '') : '';
  const match =
    custom && (named ? BUILT_IN_TYPES.find((type) => type === spelled) : closest(field.type, [...BUILT_IN_TYPES, 'group', 'section']));
  const problem = `"${field.type}" is not a built-in field type`;
  return [
    ...(match
      ? [warning('unknown-field-type', `${path}/type`, problem, `Use "${match}", or register a component for "${field.type}"`)]
      : custom && !named
        ? [
            warning(
              'custom-type-name',
              `${path}/type`,
              problem,
              'Name custom types with a dash or colon, like "x-rating", so a future built-in type cannot take the name',
            ),
          ]
        : []),
    ...optionIssues(entry),
    ...ruleWarnings(context, entry),
    ...sourceWarnings(entry),
    ...(field.optionsDependsOn ?? []).flatMap((key, index) =>
      missingTarget(context, key, `${path}/optionsDependsOn/${index}`).map((issue) => ({ ...issue, severity: 'warning' as const })),
    ),
  ];
}

function routeWarnings({ definition }: CheckContext): DefinitionIssue[] {
  const steps = definition.steps ?? [];
  return steps.flatMap((step, index) => {
    const issues: DefinitionIssue[] = [];
    const targets = new Set((step.routes ?? []).map((route) => route.to).filter((to) => to !== null));
    for (const target of targets) {
      const position = steps.findIndex((candidate) => candidate.id === target);
      const sibling = steps[position + 1];
      const exits = steps[position]?.routes?.some((route) => !route.show?.length && !route.showAny?.length);
      if (!sibling || !targets.has(sibling.id) || exits) continue;
      issues.push(
        warning(
          'route-fallthrough',
          `/steps/${position}`,
          `branch "${target}" from "${step.id}" continues into the sibling branch "${sibling.id}"`,
          `Add an unconditional route on "${target}" to the step where the branches meet`,
        ),
      );
    }
    if (step.skip && (step.next === false || !steps[1])) {
      issues.push(
        warning(
          'skip-unreachable',
          `/steps/${index}/skip`,
          `step "${step.id}" has "skip" but no Continue button or later step`,
          'Remove "skip", or remove "next": false',
        ),
      );
    }
    return issues;
  });
}

function versionWarnings({ definition, nodes }: CheckContext): DefinitionIssue[] {
  const [major, minor = 0] = String(definition.formatVersion ?? '1.0')
    .split('.')
    .map(Number);
  const scale = nodes.find(({ node }) => SCALE_TYPES.includes(node.type));
  const container = nodes.find(({ node }) => node.type === 'section' || node.type === 'group');
  const [found, needed] = scale && minor < 3 ? [scale, 3] : [container, 1];
  if (!found || major !== 1 || minor >= needed) return [];
  return [
    warning(
      'outdated-format-version',
      '/formatVersion',
      `${found.path} is a ${found.node.type}, which needs format 1.${needed}`,
      needed > 1
        ? 'Set "formatVersion": "1.3". Older versions of @formhaus/core treat this type as a custom type and do not validate it. Upgrade the server that runs validateSubmission() first'
        : 'Set "formatVersion": "1.1", so that older versions of @formhaus/core reject the definition instead of skipping the fields inside',
    ),
  ];
}

export function definitionWarnings(context: CheckContext): DefinitionIssue[] {
  return [
    ...versionWarnings(context),
    ...propertyWarnings(context),
    ...context.conditions.flatMap((entry) => conditionWarnings(context, entry)),
    ...context.entries.flatMap((entry) => fieldWarnings(context, entry)),
    ...routeWarnings(context),
  ];
}

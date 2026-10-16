import type { CheckContext, FieldEntry } from './context';
import type { DefinitionIssue } from './issues';
import { closest, pointer, warning } from './issues';
import { isEntry, missing } from './shape';

export const PROPERTIES = {
  form: '$schema formatVersion id lang title description messages labels i18n submit cancel fields steps',
  step: 'id title description fields show showAny routes next back skip i18n',
  field:
    'key type label placeholder helperText autoAdvance defaultValue source show showAny validation options layout optionsFrom optionsDependsOn accept rows mask inputMode props i18n',
  section: 'key type title description show showAny fields i18n',
  group: 'key type label helperText itemLabel addLabel removeLabel defaultItems show showAny validation fields i18n',
  option: 'value label i18n',
  action: 'label variant disabled i18n',
  route: 'to show showAny',
  validation:
    'required minLength minLengthMessage maxLength maxLengthMessage min minMessage max maxMessage pattern patternMessage matchField matchFieldMessage validator i18n',
};

const LABEL_HINT = 'Add a label so screen readers can name the input';

function unknown(value: object, path: string, list: string, hint: (key: string) => string | undefined = () => undefined) {
  const known = list.split(' ');
  const absent = known.filter((key) => !(key in value));
  return Object.keys(value)
    .filter((key) => !known.includes(key))
    .map((key) => {
      const match = closest(key, absent);
      const fix = match === undefined ? hint(key) : `Did you mean "${match}"?`;
      return warning('unknown-property', `${path}/${pointer(key)}`, `unknown property "${key}"`, fix);
    });
}

function required(value: object, path: string, key: string, hint?: string): DefinitionIssue[] {
  return (value as Record<string, unknown>)[key] === undefined ? [missing(path, key, hint, warning)] : [];
}

function action(value: unknown, path: string, disables = true): DefinitionIssue[] {
  if (!isEntry(value)) return [];
  const ignored = !disables && value.disabled !== undefined;
  return [
    ...required(value, path, 'label'),
    ...unknown(value, path, PROPERTIES.action),
    ...(ignored
      ? [
          warning(
            'disabled-not-applicable',
            `${path}/disabled`,
            'the built-in renderers ignore "disabled" on this button',
            'Remove "disabled"',
          ),
        ]
      : []),
  ];
}

const misplaced = (key: string) =>
  key !== 'i18n' && PROPERTIES.validation.split(' ').includes(key) ? `Move "${key}" into "validation": { "${key}": ... }` : undefined;

function fieldWarnings({ field, path }: FieldEntry): DefinitionIssue[] {
  const visible = field.type !== 'hidden';
  const empty = visible && typeof field.label === 'string' && !field.label.trim();
  return [
    ...required(field, path, 'label', visible ? LABEL_HINT : undefined),
    ...(empty ? [warning('empty-label', `${path}/label`, `the label of "${field.key}" is empty`, LABEL_HINT)] : []),
    ...unknown(field, path, field.type === 'group' ? PROPERTIES.group : PROPERTIES.field, misplaced),
    ...(field.options ?? []).flatMap((option, index) => [
      ...required(option, `${path}/options/${index}`, 'label'),
      ...unknown(option, `${path}/options/${index}`, PROPERTIES.option),
    ]),
    ...(isEntry(field.validation) ? unknown(field.validation, `${path}/validation`, PROPERTIES.validation) : []),
  ];
}

export function propertyWarnings({ definition, entries, nodes }: CheckContext): DefinitionIssue[] {
  const { title } = definition as { title?: unknown };
  return [
    ...required(definition, '', 'title', 'Add a title for host UI and editors'),
    ...(title === undefined || typeof title === 'string' ? [] : [warning('invalid-type', '/title', '"title" must be a string')]),
    ...unknown(definition, '', PROPERTIES.form),
    ...action(definition.submit, '/submit'),
    ...action(definition.cancel, '/cancel', false),
    ...(definition.steps ?? []).flatMap((step, index) => {
      const path = `/steps/${index}`;
      return [
        ...required(step, path, 'title'),
        ...unknown(step, path, PROPERTIES.step),
        ...(step.routes ?? []).flatMap((route, position) => unknown(route, `${path}/routes/${position}`, PROPERTIES.route)),
        ...(['next', 'back', 'skip'] as const).flatMap((name) => action(step[name], `${path}/${name}`, name === 'next')),
      ];
    }),
    ...nodes.flatMap(({ node, path }) =>
      node.type === 'section' ? [...required(node, path, 'title'), ...unknown(node, path, PROPERTIES.section)] : [],
    ),
    ...entries.flatMap(fieldWarnings),
  ];
}

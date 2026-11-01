import type { FormDefinition, FormField, FormSection } from '../types';
import type { CheckContext, FieldEntry } from './context';
import type { DefinitionIssue } from './issues';
import { closest, pointer, warning } from './issues';
import { isEntry } from './shape';
import { RANDOMIZED_TYPES } from '../validation/type-checks';
import { missingProperty } from './texts';
import { formatAtLeast } from './format';

export const PROPERTIES = {
  form: '$schema formatVersion id lang title description messages labels i18n submit cancel fields steps',
  step: 'id title description fields show showAny routes next back skip i18n',
  field:
    'key type label placeholder helperText autoAdvance defaultValue source show showAny validation options randomize layout columns optionsFrom optionsDependsOn accept multiple rows mask inputMode autocomplete readOnly props i18n',
  section: 'key type title description layout show showAny fields i18n',
  group: 'key type label helperText itemLabel addLabel removeLabel defaultItems reorderable show showAny validation fields i18n',
  option: 'value label image exclusive pinned hint disabled i18n',
  action: 'label variant disabled i18n',
  route: 'to show showAny',
  validation:
    'required minLength minLengthMessage maxLength maxLengthMessage min minMessage max maxMessage pattern patternMessage matchField matchFieldMessage validator i18n',
};

const SINCE: [number, string][] = [
  [7, 'multiple'],
  [8, 'readOnly'],
  [8, 'reorderable'],
  [8, 'hint'],
  [8, 'disabled'],
];

const known = (list: string, definition: FormDefinition) =>
  SINCE.reduce((text, [minor, key]) => (formatAtLeast(definition, minor) ? text : text.replace(` ${key} `, ' ')), list);

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

const absent = (code: 'missing-property' | 'missing-label', path: string, key: string, hint?: string) =>
  warning(code, path, missingProperty(key), hint);

function required(value: object, path: string, key: string, hint?: string): DefinitionIssue[] {
  return (value as Record<string, unknown>)[key] === undefined ? [absent('missing-property', path, key, hint)] : [];
}

function labeled(value: object, path: string, hint?: string): DefinitionIssue[] {
  return (value as Record<string, unknown>).label === undefined ? [absent('missing-label', `${path}/label`, 'label', hint)] : [];
}

function action(value: unknown, path: string, disables = true): DefinitionIssue[] {
  if (!isEntry(value)) return [];
  const ignored = !disables && value.disabled !== undefined;
  return [
    ...labeled(value, path),
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

const optionValues = ({ options, optionsFrom }: Partial<FormField>) =>
  !optionsFrom && Array.isArray(options) ? JSON.stringify(options.map((option) => option?.value)) : undefined;

function fieldWarnings({ field, path, parent }: FieldEntry, definition: FormDefinition): DefinitionIssue[] {
  const visible = field.type !== 'hidden';
  const matrix = (parent as FormSection | undefined)?.layout === 'matrix';
  const choice = /^(radio|multiselect)$/.test(field.type);
  const columns = matrix ? optionValues((parent as FormSection).fields[0] as Partial<FormField>) : undefined;
  const empty = visible && typeof field.label === 'string' && !field.label.trim();
  return [
    ...(visible ? labeled(field, path, LABEL_HINT) : []),
    ...(empty ? [warning('missing-label', `${path}/label`, `the label of "${field.key}" is empty`, LABEL_HINT)] : []),
    ...unknown(field, path, known(field.type === 'group' ? PROPERTIES.group : PROPERTIES.field, definition), misplaced),
    ...(field.options ?? []).flatMap((option, index) => [
      ...labeled(option, `${path}/options/${index}`),
      ...unknown(option, `${path}/options/${index}`, known(PROPERTIES.option, definition)),
      ...(option.disabled !== undefined && !RANDOMIZED_TYPES.includes(field.type) && formatAtLeast(definition, 8)
        ? [
            warning(
              'disabled-not-applicable',
              `${path}/options/${index}/disabled`,
              `"disabled" on an option of "${field.key}" applies to radio, multiselect and select fields`,
              'Remove "disabled"',
            ),
          ]
        : []),
      ...(typeof option.image === 'string' && !/^(https:|data:image\/)/i.test(option.image)
        ? [
            warning(
              'unsafe-image-url',
              `${path}/options/${index}/image`,
              `the image of option "${option.value}" in "${field.key}" is not an https: or data:image/ URL`,
              'Serve the image over https',
            ),
          ]
        : []),
      ...(option.pinned && !field.randomize
        ? [
            warning(
              'randomize-not-applicable',
              `${path}/options/${index}/pinned`,
              `"${field.key}" does not set "randomize"`,
              'Remove "pinned"',
            ),
          ]
        : []),
    ]),
    ...(field.randomize && (!RANDOMIZED_TYPES.includes(field.type) || matrix)
      ? [
          warning(
            'randomize-not-applicable',
            `${path}/randomize`,
            `"randomize" of "${field.key}" applies to radio, multiselect and select fields outside a matrix`,
            'Remove "randomize"',
          ),
        ]
      : []),
    ...(formatAtLeast(definition, 7) && field.multiple !== undefined && field.type !== 'file'
      ? [warning('multiple-not-applicable', `${path}/multiple`, `"multiple" of "${field.key}" applies to file fields`, 'Remove "multiple"')]
      : []),
    ...(columns && choice && (optionValues(field) ?? columns) !== columns
      ? [
          warning(
            'matrix-options-mismatch',
            `${path}/options`,
            `the option values of "${field.key}" differ from the columns of the matrix "${parent!.key}"`,
            'Use the options of the first field in every row',
          ),
        ]
      : []),
    ...(isEntry(field.validation) ? unknown(field.validation, `${path}/validation`, PROPERTIES.validation) : []),
    ...(field.columns !== undefined && (!choice || matrix || !field.options?.some((option) => option.image))
      ? [
          warning(
            'columns-not-applicable',
            `${path}/columns`,
            `"columns" of "${field.key}" applies to radio and multiselect options with images outside a matrix`,
            'Remove "columns"',
          ),
        ]
      : []),
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
    ...entries.flatMap((entry) => fieldWarnings(entry, definition)),
  ];
}

import { FORMAT_VERSION } from '@formhaus/core';
import { i18nCapabilities } from './translation';
import {
  ACTION_VARIANTS,
  CONDITION_OPERATORS,
  CONTAINER_TYPES,
  FIELD_TYPES,
  GROUP_RULES,
  OPTION_FIELD_TYPES,
  VALIDATION_RULES,
} from './vocabulary';

export const capabilities = {
  definition: {
    required: ['id', 'title', 'submit'],
    optional: ['formatVersion', 'lang', 'description', 'messages', 'labels', 'i18n', 'cancel', 'fields', 'steps'],
    rule: 'Use either "fields" (single page) or "steps" (multi-step), never both.',
    formatVersion: FORMAT_VERSION,
    formatVersionRule: `Optional. A newer major version than ${FORMAT_VERSION} is reported as unsupported-format-version. Set "1.1" when the definition has sections or groups, otherwise outdated-format-version is reported.`,
  },
  containerTypes: CONTAINER_TYPES,
  sections: {
    shape: '{ key, type: "section", title, description?, show?, showAny?, fields, i18n? }',
    rules: [
      'A section is a titled block of fields and groups inside "fields" or "step.fields". It holds no value, and its fields keep their own keys in the payload.',
      'Its show/showAny apply to every field inside. Hidden section fields are cleared.',
      'The key shares the namespace of field keys. Conditions cannot test a section key (unknown-field).',
      'Sections do not nest (invalid-nesting). A section condition on its own field is a condition-cycle.',
    ],
  },
  groups: {
    shape:
      '{ key, type: "group", label, helperText?, itemLabel?, addLabel?, removeLabel?, defaultItems?, show?, showAny?, validation?, fields, i18n? }',
    validationRules: GROUP_RULES,
    rules: [
      'A repeatable group. Its value is an array of item objects keyed by the keys of its fields, such as { "participants": [{ "name": "Ada", "email": "ada@example.com" }] }.',
      'required means at least one item; minLength and maxLength count items. Without maxLength the Add button stops at 100 items.',
      'itemLabel is the item heading; {index} is the 1-based item number and {label} the group label.',
      'Item keys are unique in the item and must not repeat a key outside the group (duplicate-key). No other key may start with "<group key>.".',
      'Item conditions and matchField may use fields of the same item and fields outside the group. Conditions outside the group cannot use item fields (group-scope); they may test the group itself with notEmpty.',
      'No sections, groups, file or hidden fields inside a group (invalid-nesting).',
      'Errors of item fields use the 0-based path "<group>.<index>.<field>", such as participants.1.email. Count errors use the group key.',
    ],
  },
  fieldTypes: FIELD_TYPES,
  customFieldTypes: 'Any other string is allowed; the renderer must register a component for it.',
  fieldTypeNotes: {
    time: 'A 24-hour "HH:MM" or "HH:MM:SS" string.',
    hidden:
      'Renders no label or control, so the label is optional. Its value comes from the initial values, then its source, then defaultValue. It is checked as text up to maxLength, or 2000 characters without it, follows show conditions like any field and gets its value back when they match again. Its errors show as form errors that name the field by its label, or by its key without one.',
  },
  fieldProps: {
    required: ['key', 'type', 'label'],
    optional: [
      'placeholder',
      'helperText',
      'defaultValue',
      'show',
      'showAny',
      'validation',
      'options',
      'optionsFrom',
      'optionsDependsOn',
      'accept',
      'rows',
      'mask',
      'inputMode',
      'autoAdvance',
      'layout',
      'columns',
      'i18n',
      'source',
      'props',
    ],
    source:
      'hidden only. Fills the value in the browser at mount: { "query": "utm_source" } reads a URL parameter; "referrer", "page" (URL without query and hash), "pageTitle", "language", "timezone" or "device" (mobile, tablet or desktop). "country" is filled by the server at submission, such as Formhaus Cloud; browsers leave it empty. A source that yields nothing leaves defaultValue. Values are user-controllable; do not make tracking fields required. A fixed value is defaultValue without a source.',
    props:
      'Custom field types only: an object of settings the custom component reads as field.props. Core ignores it. Added in format 1.2.',
    optionFieldTypes: OPTION_FIELD_TYPES,
    options: 'Array of { value: string, label: string }.',
    inputMode: ['text', 'numeric', 'decimal', 'tel', 'email', 'url', 'search'],
    layout: 'radio and multiselect only: "stack" (default) or "inline" for short options.',
    columns:
      'radio and multiselect with option images only: picture cards per row, a whole number from 1 to 4. Omit it to fill the row with cards about 200px wide. Added in format 1.3.',
  },
  validationRules: {
    rules: VALIDATION_RULES,
    messages:
      'Each bound rule accepts a custom message: minLengthMessage, maxLengthMessage, minMessage, maxMessage, patternMessage, matchFieldMessage. "required" accepts true or a message string.',
    semantics: [
      'minLength/maxLength apply to strings and arrays; min/max apply to numbers.',
      'pattern is a JavaScript regular expression string.',
      'matchField requires the value to equal another field, and fails when this field is empty and the other is not.',
      'Built-in types are checked: email format, date, datetime and time shape, numbers, booleans and option values.',
      'validator names a custom function passed to the engine.',
      'Fields hidden by conditions and skipped steps are not validated.',
      'Group items are validated one by one; their errors use paths such as participants.0.email.',
    ],
  },
  conditions: {
    operators: CONDITION_OPERATORS,
    shape: '{ field, eq | neq | in | notIn | notEmpty | gt | gte | lt | lte }, exactly one operator',
    show: 'All conditions must match.',
    showAny: 'At least one condition must match.',
    appliesTo: ['field', 'section', 'group', 'step', 'route', 'action.disabled'],
    comparisons: 'gt, gte, lt and lte take a number and also compare numeric strings such as radio option values.',
    scope:
      'Conditions see only answers that come before them: a field condition may use fields of the same or an earlier step, a step or route condition fields of earlier steps (routes: the same step too). A condition on a later step or an unknown key is an error.',
    hiddenValues:
      'Fields hidden by conditions are cleared at once and left out of submitted values. A field shown again gets back its last value, or else its initial value or defaultValue.',
  },
  steps: {
    props: ['id', 'title', 'description', 'fields', 'show', 'showAny', 'routes', 'next', 'back', 'skip'],
    navigation: [
      'Next validates the current step before moving forward.',
      'Back returns to the previous step on the active path without validating.',
      'Steps with show/showAny that do not match are left out of the path.',
      'The last step on the active path shows Submit instead of Next.',
    ],
    routes: [
      'routes is an array of { to, show?, showAny? } checked in order; the first match whose target is visible wins.',
      'A route without conditions always matches and acts as a fallback.',
      'to must name a later declared step, or null.',
      'to: null ends the active path at the current step, which then shows Submit.',
      'If no route matches, navigation falls through to the next visible step in declaration order.',
      'Branches must converge explicitly with an unconditional route, or they fall through into sibling branches.',
      'Route conditions may only reference fields on the current or earlier steps.',
    ],
    next: 'next: false hides the primary Next button; navigation still works through autoAdvance. It never hides Submit.',
    back: 'back: false hides the Back button on that step.',
    skip: 'skip: { label } shows a Skip button that resets the step fields to defaults and moves on without validation. Skipped fields are not submitted. Skip on the last step submits.',
    autoAdvance: 'autoAdvance: true on a radio field advances after the user picks an option and the step validates.',
  },
  actions: {
    shape: '{ label, variant?, disabled? }',
    variants: ACTION_VARIANTS,
    slots: ['submit', 'cancel', 'step.next', 'step.back', 'step.skip'],
  },
  i18n: i18nCapabilities,
  adapters: [
    { name: '@formhaus/react', description: 'React FormRenderer and HeadlessFormRenderer.' },
    { name: '@formhaus/vue', description: 'Vue 3 FormRenderer and HeadlessFormRenderer.' },
    { name: 'Formhaus Figma plugin', description: 'Renders a definition as Figma frames and a prototype flow.' },
  ],
} as const;

export function capabilitiesTool(): typeof capabilities {
  return capabilities;
}

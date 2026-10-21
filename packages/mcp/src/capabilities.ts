import { FORMAT_VERSION } from '@formhaus/core';
import { i18nCapabilities } from './translation';
import {
  ACTION_VARIANTS,
  CONDITION_OPERATORS,
  CONTAINER_TYPES,
  AUTO_ADVANCE_TYPES,
  FIELD_TYPES,
  GROUP_RULES,
  IMAGE_FIELD_TYPES,
  OPTION_FIELD_TYPES,
  SCALE_FIELD_TYPES,
  SECTION_LAYOUTS,
  VALIDATION_RULES,
} from './vocabulary';

export const capabilities = {
  definition: {
    required: ['id', 'title', 'submit'],
    optional: ['formatVersion', 'lang', 'description', 'messages', 'labels', 'i18n', 'cancel', 'fields', 'steps'],
    rule: 'Use either "fields" (single page) or "steps" (multi-step), never both.',
    formatVersion: FORMAT_VERSION,
    formatVersionRule: `Optional. A newer major version than ${FORMAT_VERSION} is reported as unsupported-format-version. Set "1.1" when the definition has sections or groups. Set "1.3" when it has scale or rating fields, option images or a matrix section. Set "1.4" when a condition uses contains or notContains. Set "1.5" when a text uses {{key}} answer recall, an option is exclusive or a field has autocomplete. Set "1.6" when a field has randomize or an option is pinned. outdated-format-version is reported for sections, groups, scale, rating, contains, notContains, {{key}}, exclusive options, autocomplete, randomize and pinned.`,
  },
  containerTypes: CONTAINER_TYPES,
  sections: {
    shape: '{ key, type: "section", title, description?, layout?, show?, showAny?, fields, i18n? }',
    layouts: SECTION_LAYOUTS,
    rules: [
      'A section is a titled block of fields and groups inside "fields" or "step.fields". It holds no value, and its fields keep their own keys in the payload.',
      'Its show/showAny apply to every field inside. Hidden section fields are cleared.',
      'The key shares the namespace of field keys. Conditions cannot test a section key (unknown-field).',
      'Sections do not nest (invalid-nesting). A section condition on its own field is a condition-cycle.',
      'fields may be empty: a section with a title and description and no fields is a statement between questions.',
      'layout: "matrix" shows the section as a grid (Likert). Each field is a row: radio, or multiselect for several picks per row. Every row has the same options, which become the column headers. Values stay flat, one key per row. Keep it to 7 columns or fewer. Rows do not autoAdvance.',
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
    scale:
      'Opinion scale. The value is a whole number. validation.min (0 or 1, default 1) and validation.max (default 5) set the range, 3 to 11 points. NPS is a scale with min 0, max 10 and anchors "Not at all likely" and "Extremely likely"; branch on it with lte: 6 and gte: 9. 0 counts as an answer for required and notEmpty.',
    rating:
      'Stars from 1 to validation.max (default 5, allowed 3 to 10). The value is a whole number. validation.min is an ordinary rule, "at least N stars".',
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
      'randomize',
      'optionsFrom',
      'optionsDependsOn',
      'accept',
      'rows',
      'mask',
      'inputMode',
      'autocomplete',
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
    options:
      'Array of { value: string, label: string, image?, exclusive?, pinned? }. image is an image URL shown above the label on radio and multiselect options (picture choice); the label stays visible and names the option. select and autocomplete ignore image.',
    exclusive:
      'multiselect with static options only: "exclusive": true makes an option such as "None of these" or "Prefer not to say" the only answer. Picking it clears the other answers, picking another option clears it, and several exclusive options also clear each other. Put exclusive options last; renderers show the "or" label before them. A list with an exclusive option and any other value fails the type check with the exclusive message. One exclusive option alone answers required and skips minLength. contains and notContains work as usual. Set "formatVersion": "1.5".',
    randomize:
      'radio, multiselect and select only: "randomize": true shows the options in a random order that stays the same for one respondent, as research surveys do against position bias. "pinned": true on an option keeps it at its written position, such as "Other"; exclusive options are always pinned. Values, conditions and validation do not change. Not applied in a matrix section. Another type, a matrix row or pinned without randomize is randomize-not-applicable. Needs "formatVersion": "1.6". In code, the order needs research from @formhaus/core/research, passed to FormRenderer, useFormEngine or FormEngine; without it the options show in written order. Formhaus Cloud hosted pages and embeds shuffle the options and store the order each respondent saw with the response.',
    imageFieldTypes: IMAGE_FIELD_TYPES,
    anchorFieldTypes: SCALE_FIELD_TYPES,
    anchors:
      'scale and rating only: options are anchor labels, not choices. value is the point number as a string, such as "0" or "10". Only three points show their label: the first at the start, the middle point floor((min + max) / 2) in the center and the last at the end.',
    inputMode: ['text', 'numeric', 'decimal', 'tel', 'email', 'url', 'search'],
    autocomplete:
      'HTML autofill token that lets browsers fill the field, such as "given-name", "family-name", "email", "tel", "street-address", "postal-code", "bday", "organization", "one-time-code" or "off". Optional prefixes: "section-name", "shipping" or "billing", and a contact type ("home", "work", "mobile") before "tel" or "email". Applies to text, email, phone, password, textarea, number, date, select, autocomplete and radio fields, such as "country" on a select. The autocomplete field type sets "off" when unset. Inside a group item the renderers prefix "section-<group key>-<index>". Set it on personal data fields; there is no default. An unknown token is unknown-autocomplete-token, another field type is autocomplete-not-applicable. Needs "formatVersion": "1.5".',
    lineBreaks: 'A \\n in a step or section description or in helperText shows as a line break. The text stays plain: no HTML or Markdown.',
    layout: 'radio and multiselect only: "stack" (default) or "inline" for short options.',
    autoAdvance: `${AUTO_ADVANCE_TYPES.join(', ')} only. Ignored inside a group or a matrix section.`,
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
      'Built-in types are checked: email format, date, datetime and time shape, numbers, booleans and option values. scale and rating values must be whole numbers in range.',
      'validator names a custom function passed to the engine.',
      'Fields hidden by conditions and skipped steps are not validated.',
      'Group items are validated one by one; their errors use paths such as participants.0.email.',
    ],
  },
  conditions: {
    operators: CONDITION_OPERATORS,
    shape: '{ field, eq | neq | in | notIn | contains | notContains | notEmpty | gt | gte | lt | lte }, exactly one operator',
    show: 'All conditions must match.',
    showAny: 'At least one condition must match.',
    appliesTo: ['field', 'section', 'group', 'step', 'route', 'action.disabled'],
    comparisons:
      'gt, gte, lt and lte take a number and also compare numeric strings such as radio option values. Conditions on scale and rating take numbers, such as { "field": "nps", "lte": 6 }. Use two conditions for a range: [{ "field": "nps", "gte": 7 }, { "field": "nps", "lte": 8 }].',
    lists:
      'A multiselect value is a list, so eq, neq, in and notIn never test its items. contains matches when the list holds the value, such as { "field": "interests", "contains": "other" }. notContains matches when it does not, also before the question is answered. contains never matches a value that is not a list. Set "formatVersion": "1.4" on definitions that use them.',
    scope:
      'Conditions see only answers that come before them: a field condition may use fields of the same or an earlier step, a step or route condition fields of earlier steps (routes: the same step too). A condition on a later step or an unknown key is an error.',
    hiddenValues:
      'Fields hidden by conditions are cleared at once and left out of submitted values. A field shown again gets back its last value, or else its initial value or defaultValue.',
  },
  recall: {
    syntax:
      '{{key}} in a text shows the answer of the field with that top-level key. Inside a group item, {{itemKey}} shows a field of the same item. Whitespace inside the braces is allowed. Needs "formatVersion": "1.5"; below it the braces show as written.',
    slots: [
      'step title and description',
      'section title and description',
      'field and group label and helperText',
      'field placeholder',
      'group itemLabel, inside each item',
    ],
    values: [
      'Options show their label, a multiselect lists its labels.',
      'checkbox and switch show the field label when true and nothing when false.',
      'Renderers format numbers, dates, times and lists for the locale. Text and hidden values show as stored. A file lists its file names. A group shows its item count.',
      'Missing answers, fields hidden by conditions, skipped steps, unknown keys and password fields show nothing.',
    ],
    rules: [
      'Recall answers from earlier steps, such as a review step: "Check your answers: {{name}}, {{email}}, plan {{plan}}". A field on a later step or the field that holds the text is recall-forward-reference; an unknown key is unknown-recall-field.',
      'Option labels, action labels and messages show {{key}} as written. There are no expressions or formats: other content inside {{ }} shows as written and is recall-syntax. Write \\{{ for literal braces.',
      'An optional answer can be empty, so put each optional recall on its own line instead of joining answers with commas.',
      'Recalling a password field is recall-sensitive-field. Recalling a hidden field with a query source is recall-query-source: anyone can set its text in a link. Recalling a hidden field with a referrer or pageTitle source is recall-untrusted-source.',
      'Keep the {{key}} tokens in translations.',
    ],
  },
  steps: {
    props: ['id', 'title', 'description', 'fields', 'show', 'showAny', 'routes', 'next', 'back', 'skip'],
    navigation: [
      'Next validates the current step before moving forward.',
      'Back returns to the previous step on the active path without validating.',
      'Steps with show/showAny that do not match are left out of the path.',
      'The last step on the active path shows Submit instead of Next.',
      'fields may be empty: a step with only a title, description and next label is a welcome or statement screen. It counts toward the step total.',
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
    autoAdvance:
      'autoAdvance: true on a radio, scale or rating field advances after the user commits a choice (click, Space, Enter or a digit key) and the step validates. Arrow keys only move the selection.',
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

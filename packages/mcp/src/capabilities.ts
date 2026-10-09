import { ACTION_VARIANTS, CONDITION_OPERATORS, FIELD_TYPES, OPTION_FIELD_TYPES, VALIDATION_RULES } from './vocabulary';

export const capabilities = {
  definition: {
    required: ['id', 'title', 'submit'],
    optional: ['cancel', 'fields', 'steps'],
    rule: 'Use either "fields" (single page) or "steps" (multi-step), never both.',
  },
  fieldTypes: FIELD_TYPES,
  customFieldTypes: 'Any other string is allowed; the renderer must register a component for it.',
  fieldProps: {
    required: ['key', 'type', 'label'],
    optional: [
      'placeholder', 'helperText', 'defaultValue', 'show', 'showAny', 'validation', 'options',
      'optionsFrom', 'optionsDependsOn', 'accept', 'rows', 'mask', 'inputMode', 'autoAdvance',
    ],
    optionFieldTypes: OPTION_FIELD_TYPES,
    options: 'Array of { value: string, label: string }.',
    inputMode: ['text', 'numeric', 'tel', 'email'],
  },
  validationRules: {
    rules: VALIDATION_RULES,
    messages: 'Each bound rule accepts a custom message: minLengthMessage, maxLengthMessage, minMessage, maxMessage, patternMessage, matchFieldMessage. "required" accepts true or a message string.',
    semantics: [
      'minLength/maxLength apply to strings and arrays; min/max apply to numbers.',
      'pattern is a JavaScript regular expression string.',
      'matchField requires the value to equal another field.',
      'validator names a custom function passed to the engine.',
      'Hidden fields and skipped steps are not validated.',
    ],
  },
  conditions: {
    operators: CONDITION_OPERATORS,
    shape: '{ field, eq | neq | in | notIn | notEmpty }',
    show: 'All conditions must match.',
    showAny: 'At least one condition must match.',
    appliesTo: ['field', 'step', 'route', 'action.disabled'],
    hiddenValues: 'Hidden fields are cleared and left out of submitted values.',
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
    shape: '{ label, variant?, action?, disabled? }',
    variants: ACTION_VARIANTS,
    slots: ['submit', 'cancel', 'step.next', 'step.back', 'step.skip'],
  },
  adapters: [
    { name: '@formhaus/react', description: 'React FormRenderer and HeadlessFormRenderer.' },
    { name: '@formhaus/vue', description: 'Vue 3 FormRenderer and HeadlessFormRenderer.' },
    { name: 'Formhaus Figma plugin', description: 'Renders a definition as Figma frames and a prototype flow.' },
  ],
} as const;

export function capabilitiesTool(): typeof capabilities {
  return capabilities;
}

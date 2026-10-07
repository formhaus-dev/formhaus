# Definition Reference

Every form is a JSON object following the `FormDefinition` type.

## FormDefinition

Top-level structure. Use `fields` (single-step) or `steps` (multi-step), never both.

```ts
interface FormDefinition {
  id: string;            // Unique form identifier
  title: string;         // Form title for host UI and Figma output
  submit: FormAction;    // Submit button config
  cancel?: FormAction;   // Cancel button (optional)
  fields?: FormField[];  // Single-step form
  steps?: FormStep[];    // Multi-step form
}
```

## FormField

A single form field. `type` determines which UI component renders.

```ts
interface FormField {
  key: string;                    // Key in the values object
  type: FieldType;                // What to render (see Field Types page)
  label: string;                  // Label text
  placeholder?: string;           // Placeholder text
  helperText?: string;            // Hint text below the field
  defaultValue?: unknown;         // Pre-filled value
  autoAdvance?: boolean;          // Advance on explicit field activation
  show?: ShowCondition[];         // AND conditions for visibility
  showAny?: ShowCondition[];      // OR conditions for visibility
  validation?: FieldValidation;   // Validation rules
  options?: FieldOption[];        // For select, radio, multiselect
  optionsFrom?: string;           // Dynamic options provider key
  optionsDependsOn?: string[];    // Re-fetch options when these fields change
  accept?: string;                // File input mime types
  rows?: number;                  // Textarea row count
  mask?: string;                  // Input mask pattern (shown as placeholder, custom components get full access)
  inputMode?: 'text' | 'numeric' | 'tel' | 'email';
}

type DefaultFieldType =
  | 'text' | 'email' | 'phone' | 'number' | 'password'
  | 'select' | 'autocomplete' | 'multiselect'
  | 'checkbox' | 'radio' | 'switch'
  | 'file' | 'date' | 'datetime' | 'textarea';

type FieldType = DefaultFieldType | (string & {});  // any string, built-ins get autocomplete
```

## FormStep

A step in a multi-step form. Has its own fields and optional CTA overrides.

```ts
interface FormStep {
  id: string;
  title: string;
  description?: string;
  fields: FormField[];
  show?: ShowCondition[];       // Step-level visibility
  showAny?: ShowCondition[];
  routes?: StepRoute[];         // Ordered forward destinations
  next?: FormAction | false;    // Override or hide "Continue" button
  back?: FormAction | false;    // Override or hide "Back" button
}
```

## FormAction

Button configuration for submit, cancel, next, and back.

```ts
interface FormAction {
  label: string;
  variant?: 'primary' | 'secondary' | 'text'; // Styling hint for custom actions
  action?: string;              // Identifier for custom actions
  disabled?: ShowCondition[];   // Conditions available to the action renderer
}
```

The default React and Vue adapters evaluate `disabled` on the top-level `submit` action. Custom action components receive the full action objects and can use `variant`, `action`, and `disabled` for other buttons.

## ShowCondition

Conditional visibility for fields and steps. See [Conditional Fields](/guide/conditions).

```ts
interface ShowCondition {
  field: string;                          // Key of another field
  eq?: string | number | boolean;         // Equals
  neq?: string | number | boolean;        // Not equals
  in?: (string | number)[];               // Value is in list
  notIn?: (string | number)[];            // Value is not in list
  notEmpty?: boolean;                     // Value is not empty
}
```

## FieldValidation

Built-in validation rules. See [Validation](/guide/validation).

```ts
interface FieldValidation {
  required?: boolean | string;     // true or custom message
  minLength?: number;
  minLengthMessage?: string;
  maxLength?: number;
  maxLengthMessage?: string;
  min?: number;                    // For number fields
  minMessage?: string;
  max?: number;
  maxMessage?: string;
  pattern?: string;                // Regex string
  patternMessage?: string;
  matchField?: string;             // Must match another field's value
  matchFieldMessage?: string;
  validator?: string;              // Custom validator key
}
```

## FieldOption

Options for select, radio, and multiselect fields.

```ts
interface FieldOption {
  value: string;
  label: string;
}
```

## ValidatorFn

Synchronous field-level validator. Registered via the `validators` prop.

```ts
type ValidatorFn = (
  value: unknown,
  allValues: Record<string, unknown>,
) => string | null;
```

## StepValidateFn

Async step-level validator. See [Async Step Validation](/guide/async-validation) for the full guide.

```ts
type StepValidateFn = (
  stepId: string,
  values: Record<string, unknown>,
) => Promise<Record<string, string> | null | void>;
```

`FormRenderer` does not render the form title. Use it in your page heading or other host UI. The Figma plugin uses it for frame names and headings.

For runtime state and methods, see the [FormEngine reference](/api/form-engine).

## Minimal example

A working single-step form with two fields:

```json
{
  "id": "contact",
  "title": "Contact Us",
  "submit": { "label": "Send" },
  "fields": [
    {
      "key": "name",
      "type": "text",
      "label": "Your name",
      "validation": { "required": true }
    },
    {
      "key": "message",
      "type": "textarea",
      "label": "Message",
      "rows": 4,
      "validation": { "required": true, "minLength": 10 }
    }
  ]
}
```

## Explicit field activation

`FormField.autoAdvance?: boolean` enables forward navigation when a renderer field is intentionally committed. Built-in radio fields support click, Space and Enter; arrow keys only select. Custom React fields call `onCommit(value)` and Vue fields emit `commit`. Programmatic values and initial values never advance; the final step never auto-submits.

`FormStep.next` also accepts `false` to hide Next. This changes the action UI, not navigation permission. Provide an accessible retry action whenever Next is hidden. See the [radio activation example](../guide/steps#advance-when-an-answer-is-activated).

## Step routes

`FormStep.routes?: StepRoute[]` selects a forward path in routed forms:

```ts
interface StepRoute {
  to: string | null
  show?: ShowCondition[]
  showAny?: ShowCondition[]
}
```

The first matching route with a visible target wins. An unconditional last route is a fallback; no match continues to the next visible declared step. `to: null` makes this step terminal without submitting. Targets must be later declared step ids. Route conditions may reference this or earlier steps. Invalid targets and forward-field references are reported by `validateDefinition()`, and the `FormEngine` constructor throws on them. `validateDefinition()` also warns when a branch falls through into a sibling branch.

With routes enabled, progress, Back, validation, hooks and submission use the active path. Skipped values remain in `engine.values` but are excluded from the active projection. See [branch convergence, visibility, retained values and reconciliation](../guide/steps#route-between-branches) and [the complete JSON example](https://github.com/ignsm/formhaus/blob/c2bc73d57a13733352151590af1bb3fdcc796434/examples/definitions/branching-form.json).

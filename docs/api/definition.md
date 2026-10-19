---
title: "Form definition reference"
description: "FormDefinition reference: fields, steps, actions, show conditions, validation rules, options, step routes and the JSON Schema for editors."
---

# Definition Reference

Every form is a JSON object following the `FormDefinition` type. The [specification](/spec) defines how core interprets each property.

## FormDefinition

Top-level structure. Use `fields` (single-step) or `steps` (multi-step), never both. The `FormEngine` constructor throws when both are non-empty.

```ts
interface FormDefinition {
  $schema?: string;      // JSON Schema URL for editor validation
  formatVersion?: string; // Definition format, such as "1.2". Added in 0.11.2
  id: string;            // Unique form identifier
  lang?: string;         // BCP 47 tag of the texts, such as "ru". Added in 0.13.0
  title: string;         // Form title for host UI and Figma output
  description?: string;  // Text under the title, up to 1000 characters. Added in 0.10.0
  submit: FormAction;    // Submit button config
  cancel?: FormAction;   // Cancel button (optional)
  fields?: FormNode[];   // Single-step form
  steps?: FormStep[];    // Multi-step form
  messages?: MessageCatalog; // Validation message templates. Added in 0.13.0
  labels?: LabelCatalog;     // Renderer label templates. Added in 0.13.0
  i18n?: FormI18n;           // Translation keys. Added in 0.13.0
}
```

`formatVersion` names the [definition format](/spec#versioning). Omit it to use the format of the installed core. `FORMAT_VERSION` exports the format this core reads. `checkDefinition()` reports `unsupported-format-version` for a newer major version, and the `FormEngine` constructor throws on it.

## FormField

A single form field. `type` determines which UI component renders.

```ts
interface FormField {
  key: string;                    // Key in the values object
  type: FieldType;                // What to render (see Field Types page)
  label: string;                  // Label text
  placeholder?: string;           // Placeholder text
  helperText?: string;            // Hint text between the label and the control
  defaultValue?: unknown;         // Start value, used when the field is shown with no last value
  autoAdvance?: boolean;          // Advance on explicit field activation. Added in 0.7.0
  show?: ShowCondition[];         // AND conditions for visibility
  showAny?: ShowCondition[];      // OR conditions for visibility
  validation?: FieldValidation;   // Validation rules
  options?: FieldOption[];        // For select, radio, multiselect; anchor labels for scale and rating
  layout?: 'stack' | 'inline';    // Radio and multiselect option layout. Added in 0.10.0
  columns?: number;               // Picture cards per row, 1 to 4. Added in 0.19.0
  optionsFrom?: string;           // Dynamic options provider key
  optionsDependsOn?: string[];    // Re-fetch options when these fields change
  accept?: string;                // File input mime types
  rows?: number;                  // Textarea row count
  mask?: string;                  // Input mask pattern (shown as placeholder, custom components get full access)
  inputMode?: 'text' | 'numeric' | 'decimal' | 'tel' | 'email' | 'url' | 'search';
  source?: FieldSource;           // Hidden fields: where the value comes from. Added in 0.14.0
  props?: Record<string, unknown>; // Custom type settings, passed as field.props. Added in 0.15.0
}

type FieldSource =
  | { query: string }
  | 'referrer' | 'page' | 'pageTitle' | 'language' | 'timezone' | 'device' | 'country';

type DefaultFieldType =
  | 'text' | 'email' | 'phone' | 'number' | 'password'
  | 'select' | 'autocomplete' | 'multiselect'
  | 'checkbox' | 'radio' | 'switch'
  | 'file' | 'date' | 'datetime' | 'time' | 'textarea' | 'hidden'
  | 'scale' | 'rating';            // Added in 0.19.0

type FieldType = DefaultFieldType | (string & {});  // any string, built-ins get autocomplete
```

Name custom types with `-` or `:`, such as `x-rating`. These names never become built-in types. See [Custom field types](/guide/fields#custom-field-types).

## FormSection and FormGroup

Containers inside a `fields` array. Added in 0.14.0 with format 1.1. See [Sections](/guide/sections) and [Repeatable groups](/guide/groups).

```ts
type FormNode = FormField | FormSection | FormGroup;

interface FormSection {
  key: string;
  type: 'section';
  title: string;
  description?: string;
  layout?: 'matrix';              // Rows as a grid. Added in 0.19.0
  show?: ShowCondition[];
  showAny?: ShowCondition[];
  fields: (FormField | FormGroup)[]; // May be empty
  i18n?: StepI18n;
}

interface FormGroup {
  key: string;                    // Key of the item array
  type: 'group';
  label: string;
  helperText?: string;
  itemLabel?: string;             // "Participant {index}", index starts at 1
  addLabel?: string;
  removeLabel?: string;
  defaultItems?: number;
  show?: ShowCondition[];
  showAny?: ShowCondition[];
  validation?: GroupValidation;
  fields: FormField[];            // Fields of one item
  i18n?: GroupI18n;
}

interface GroupValidation {
  required?: boolean | string;    // At least one item
  minLength?: number;             // Minimum item count
  minLengthMessage?: string;
  maxLength?: number;             // Maximum item count
  maxLengthMessage?: string;
  validator?: string;             // Receives the whole array
  i18n?: { required?: string; minLength?: string; maxLength?: string };
}
```

`isSection(node)` and `isGroup(node)` from `@formhaus/core` narrow a `FormNode`.

## FormStep

A step in a multi-step form. Has its own fields and optional CTA overrides. Step ids must be unique; the `FormEngine` constructor throws on duplicates.

```ts
interface FormStep {
  id: string;
  title: string;
  description?: string;
  fields: FormNode[];           // Fields, sections and groups. Empty for a welcome or statement step
  show?: ShowCondition[];       // Step-level visibility
  showAny?: ShowCondition[];
  routes?: StepRoute[];         // Ordered forward destinations. Added in 0.7.0
  next?: FormAction | false;    // Override or hide "Continue" button
  back?: FormAction | false;    // Override or hide "Back" button
  skip?: FormAction;            // Show a "Skip" button. Added in 0.8.0
}
```

## FormAction

Button configuration for submit, cancel, next, back, and skip.

```ts
interface FormAction {
  label: string;
  variant?: 'primary' | 'secondary' | 'text'; // Button class for back, skip and cancel
  action?: string;              // Identifier for custom actions
  disabled?: ShowCondition[];   // Conditions available to the action renderer
  i18n?: { label?: string };    // Translation key for the label
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
  notEmpty?: boolean;                     // Value is not null, undefined, '' or []
  gt?: number;                            // Value is greater than
  gte?: number;                           // Value is greater than or equal to
  lt?: number;                            // Value is less than
  lte?: number;                           // Value is less than or equal to
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
  i18n?: ValidationI18n;           // Translation keys by rule name
}
```

## FieldOption

Options for select, radio, and multiselect fields, and anchor labels for scale and rating fields.

```ts
interface FieldOption {
  value: string;
  label: string;
  image?: string;                 // Picture URL for radio and multiselect. Added in 0.19.0
  i18n?: { label?: string };
}
```

## Translations

Catalogs and translation keys. See [Translations](/guide/translations) and the [specification](/spec#translations).

```ts
type MessageKey =
  | 'required' | 'minLength' | 'maxLength' | 'minItems' | 'maxItems' | 'min' | 'max' | 'pattern' | 'matchField'
  | 'email' | 'number' | 'date' | 'datetime' | 'time' | 'option' | 'options' | 'boolean' | 'string' | 'file' | 'value';
type LabelKey = 'continue' | 'back' | 'stepOf' | 'errorSummary'
  | 'addItem' | 'removeItem' | 'itemLabel' | 'itemAdded' | 'itemRemoved' | 'removeItemNamed' | 'removeItemPrompt' | 'removeItemBody' | 'cancel' // Group labels added in 0.14.0
  | 'enlargeImage' | 'close'; // Picture preview labels added in 0.19.0

type MessageCatalog = Partial<Record<MessageKey, string>>; // "Минимум {min} символов"
type LabelCatalog = Partial<Record<LabelKey, string>>;     // "Шаг {current} из {total}"

interface FormI18n { title?: string; description?: string; messages?: MessageCatalog; labels?: LabelCatalog }
interface StepI18n { title?: string; description?: string }
interface FieldI18n { label?: string; placeholder?: string; helperText?: string }
interface GroupI18n { label?: string; helperText?: string; itemLabel?: string; addLabel?: string; removeLabel?: string }
interface ValidationI18n { required?: string; minLength?: string; maxLength?: string; min?: string; max?: string; pattern?: string; matchField?: string }
```

`FormStep.i18n` and `FormSection.i18n` are a `StepI18n`, `FormField.i18n` a `FieldI18n` and `FormGroup.i18n` a `GroupI18n`. Every `i18n` value is a translation key; the text next to it is the fallback.

## ValidatorFn

Synchronous field-level validator. Registered via the `validators` prop. Return an error string, or `null` or `''` for no error. The `FormEngine` constructor warns about a `validator` name that is not registered.

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

`FormRenderer` does not render the form title or description. Use them in your page heading or other host UI. The Figma plugin uses the title for frame names and headings and shows the description under it.

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

The first matching route with a visible target wins. An unconditional last route is a fallback; no match continues to the next visible declared step. `to: null` makes this step terminal without submitting. Targets must be later declared step ids. Route conditions may reference this or earlier steps. Invalid targets and forward-field references are reported by `checkDefinition()`, and the `FormEngine` constructor throws on them. Step `show`/`showAny` conditions must reference earlier steps, and field conditions this or an earlier step, with or without routes; the constructor throws otherwise. `checkDefinition()` also warns when a branch falls through into a sibling branch.

With routes enabled, progress, Back, validation, hooks and submission use the active path. Skipped values remain in `engine.values` but are excluded from the active projection. See [branch convergence, visibility, retained values and reconciliation](../guide/steps#route-between-branches) and [the complete JSON example](/guide/examples#branching-form).

## JSON Schema

`@formhaus/core` ships a JSON Schema for `FormDefinition`, also served at `https://formhaus.dev/schema/form-definition.json`:

```ts
import schema from '@formhaus/core/schema.json' with { type: 'json' }
```

Point editors at it with `$schema`:

```json
{
  "$schema": "https://formhaus.dev/schema/form-definition.json",
  "id": "contact",
  "title": "Contact Us",
  "submit": { "label": "Send" },
  "fields": [{ "key": "name", "type": "text", "label": "Your name" }]
}
```

## Version history

Definition properties added since 0.7.0. Earlier versions do not support them.

| Property | Added in |
|---|---|
| `scale` and `rating` types, `image` on options, `columns` on fields, `layout: "matrix"` on sections, format 1.3 | 0.19.0 |
| `props` on fields, format 1.2 | 0.15.0 |
| `type: "section"` and `type: "group"` nodes, format 1.1 | 0.14.0 |
| `lang`, `messages`, `labels` and `i18n` | 0.13.0 |
| `formatVersion` on `FormDefinition` | 0.11.2 |
| `description` on `FormDefinition` | 0.10.0 |
| `layout` on fields | 0.10.0 |
| `skip` on steps | 0.8.0 |
| `routes` on steps | 0.7.0 |
| `next: false` on steps | 0.7.0 |
| `autoAdvance` on fields | 0.7.0 |

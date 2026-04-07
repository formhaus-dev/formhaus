# Definition Reference

Every form is a JSON object following the `FormSchema` type.

## FormSchema

Top-level structure. Use `fields` (single-step) or `steps` (multi-step), never both.

```ts
interface FormSchema {
  id: string;            // Unique form identifier
  title: string;         // Form title (rendered by the adapter or parent)
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
  | 'select' | 'multiselect'
  | 'checkbox' | 'radio' | 'switch'
  | 'file' | 'date' | 'textarea';

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
  next?: FormAction;            // Override "Continue" button
  back?: FormAction | false;    // Override or hide "Back" button
}
```

## FormAction

Button configuration for submit, cancel, next, and back.

```ts
interface FormAction {
  label: string;
  variant?: 'primary' | 'secondary' | 'text';
  action?: string;              // Named action handler key
  disabled?: ShowCondition[];   // Conditional disable
}
```

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

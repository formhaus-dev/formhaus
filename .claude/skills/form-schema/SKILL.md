---
name: form-schema
description: |
  Generate @formhaus/core JSON schemas from any input: text description,
  CSV/table, or screenshot of a form. Interactive step/condition builder.
  Output pastes directly into the Formhaus Figma plugin or FormRenderer.
  Use when: "generate form", "form schema", "form JSON", "create a form",
  or when user describes form fields in any format.
allowed-tools:
  - Read
  - Write
  - Glob
  - Grep
  - AskUserQuestion
  - Agent
---

# Form Schema Generator

You generate valid `@formhaus/core` JSON schemas from any input.
The output is ready to paste into the Formhaus Figma plugin or use with FormRenderer.

## Types Reference

These are the exact TypeScript types. Your output MUST conform to them.

```typescript
interface FormSchema {
  id: string;           // kebab-case identifier
  title: string;        // human-readable form title
  submit: FormAction;   // submit button config (required)
  cancel?: FormAction;  // cancel button (optional)
  fields?: FormField[]; // single-step form
  steps?: FormStep[];   // multi-step form (use steps OR fields, not both)
}

interface FormStep {
  id: string;
  title: string;
  description?: string;
  fields: FormField[];
  show?: ShowCondition[];    // step visible when ALL conditions true
  showAny?: ShowCondition[]; // step visible when ANY condition true
  next?: FormAction;         // custom "next" button label
  back?: FormAction | false; // custom "back" or false to hide it
}

interface FormField {
  key: string;                // camelCase field identifier
  type: FieldType;
  label: string;
  placeholder?: string;
  helperText?: string;
  defaultValue?: unknown;
  show?: ShowCondition[];     // field visible when ALL conditions true
  showAny?: ShowCondition[];  // field visible when ANY condition true
  validation?: FieldValidation;
  options?: FieldOption[];    // for select, multiselect, radio
  optionsFrom?: string;       // dynamic options loaded at runtime
  optionsDependsOn?: string[];
  accept?: string;            // for file type: "image/*", ".pdf"
  rows?: number;              // for textarea
  mask?: string;              // input mask
  inputMode?: 'text' | 'numeric' | 'tel' | 'email';
}

type FieldType =
  | 'text' | 'email' | 'phone' | 'number' | 'password'
  | 'select' | 'multiselect' | 'checkbox' | 'radio' | 'switch'
  | 'file' | 'date' | 'textarea';

interface ShowCondition {
  field: string;                        // references another field's key
  eq?: string | number | boolean;       // equals
  neq?: string | number | boolean;      // not equals
  in?: (string | number)[];             // one of
  notIn?: (string | number)[];          // not one of
  notEmpty?: boolean;                   // has a value
}

interface FieldValidation {
  required?: boolean | string;  // true or custom message
  minLength?: number;
  minLengthMessage?: string;
  maxLength?: number;
  maxLengthMessage?: string;
  min?: number;
  minMessage?: string;
  max?: number;
  maxMessage?: string;
  pattern?: string;             // regex
  patternMessage?: string;
  matchField?: string;          // must match another field (e.g. confirmPassword)
  matchFieldMessage?: string;
  validator?: string;           // custom validator name
}

interface FieldOption { value: string; label: string; }
interface FormAction {
  label: string;
  variant?: 'primary' | 'secondary' | 'text';
  action?: string;
  disabled?: ShowCondition[];
}
```

## Workflow

### Step 1: Detect input format

Look at the user's input and classify:

- **Text description**: "Registration form with name, email, password"
- **CSV/table**: structured data with columns like key, type, label, required
- **Screenshot**: user provides a path to an image file or says "look at this screenshot"
- **Existing fixture**: user references a fixture name (read from `packages/core/fixtures/`)

### Step 2: Extract fields

From the input, extract a flat list of fields with: key, type, label, and any
obvious validation (required, email format, etc).

**Type inference rules:**
- Email addresses → `email`
- Phone numbers → `phone`
- Passwords, PINs → `password`
- "Agree to terms", "Subscribe" → `checkbox`
- "Account type", "Gender" with 2-4 options → `radio`
- Dropdowns, "Select..." with 5+ options → `select`
- Country, city, currency → `select`
- Long text, "Description", "Notes", "Bio" → `textarea`
- Dates, birthdays, "When" → `date`
- File upload, "Attach", "Upload" → `file`
- Toggle, "Enable/Disable", notifications → `switch`
- Numbers, amounts, quantities → `number`
- Everything else → `text`

### Step 3: Interactive refinement

Use AskUserQuestion for each decision point. ONE question at a time.

**3a: Steps**

If the form has 5+ fields, ask:

> "This form has N fields. Should it be a single page or split into steps?
> If steps, describe how to group them (e.g. 'Personal info, Address, Payment')."

Options:
- A) Single step (all fields on one page)
- B) Multi-step (I'll describe the groups)
- C) Auto-group (you decide based on field types)

If C: group by semantic similarity (personal info, address, account, payment, etc.).

**3b: Conditions**

If any field logically depends on another (e.g. "Bank name" only makes sense
when payment method is "bank"), ask:

> "I noticed [field X] probably only shows when [field Y] = [value].
> Should I add show conditions?"

Options:
- A) Yes, add the conditions you suggested
- B) No conditions, show everything always
- C) Let me specify which fields depend on what

**3c: Validation**

For each field, infer validation:
- Fields marked "required" or with * → `required: true`
- Email fields → pattern for email format
- Password fields → minLength: 8
- Phone fields → inputMode: 'tel'
- Number fields → inputMode: 'numeric'

Ask only if there's ambiguity: "Should [field] be required?"

### Step 4: Generate JSON

Output the complete FormSchema JSON. Follow these rules:

1. `id` is kebab-case derived from the title
2. `key` for each field is camelCase
3. Every form MUST have `submit: { label: "..." }`
4. Use `fields` for single-step, `steps` for multi-step
5. Only include optional properties when they add value (no empty strings, no `required: false`)
6. Options for select/radio must have both `value` and `label`

### Step 5: Present and confirm

Show the generated JSON in a code block. Ask:

> "Here's your form schema. You can paste this directly into the
> Formhaus Figma plugin or use with FormRenderer."

Options:
- A) Looks good, copy and done
- B) Make changes (specify what)

If B: apply changes and re-present

## Example Fixtures

For reference, these existing fixtures show correct schema patterns:

- `basic-form.json` — single step, text + select, basic validation
- `conditional-fields.json` — show conditions (payment method switches fields)
- `multi-step-form.json` — 3 linear steps
- `conditional-steps.json` — steps that show/hide based on field values
- `dispute-form.json` — cancel button, conditional disputed amount
- `validation-form.json` — password confirmation, age range, pattern validation

Read these from `packages/core/fixtures/` when you need to verify
a pattern or show the user an example.

## Rules

- NEVER output invalid JSON. Validate before presenting.
- NEVER invent field types not in the FieldType union.
- NEVER use `fields` AND `steps` in the same schema. Pick one.
- Keys must be unique within a schema (across all steps).
- ShowCondition.field must reference an existing field key.
- For multi-step: each step needs `id`, `title`, and `fields`.
- Submit label should match the form's purpose ("Submit", "Create transfer", "Register", etc.).

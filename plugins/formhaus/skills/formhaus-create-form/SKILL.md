---
name: formhaus-create-form
description: |
  Generate @formhaus/core form definitions from any input: text description,
  CSV/table, or screenshot of a form. Interactive step/condition builder.
  Output pastes directly into the Formhaus Figma plugin or FormRenderer.
  Use when: "generate form", "form definition", "form JSON", "create a form",
  "formhaus", or when user describes form fields in any format.
allowed-tools:
  - Read
  - Write
  - Glob
  - Grep
  - AskUserQuestion
  - Agent
  - mcp__plugin_formhaus_formhaus__validate_definition
  - mcp__plugin_formhaus_formhaus__simulate_path
  - mcp__plugin_formhaus_formhaus__capabilities
  - mcp__plugin_formhaus_formhaus__example_definitions
  - mcp__plugin_formhaus_formhaus__publish_form
  - mcp__plugin_formhaus_formhaus__list_forms
  - mcp__formhaus__validate_definition
  - mcp__formhaus__simulate_path
  - mcp__formhaus__capabilities
  - mcp__formhaus__example_definitions
  - mcp__formhaus__publish_form
  - mcp__formhaus__list_forms
  - Edit
  - Bash
---

# Form Definition Generator

You generate valid `@formhaus/core` form definitions from any input.
The output is ready to paste into the Formhaus Figma plugin or use with FormRenderer.
The formhaus repo does not need to be cloned. The JSON Schema is published at
`https://formhaus.dev/schema/form-definition.json`.

## Formhaus MCP tools

Check whether the `formhaus` MCP server tools are available (`validate_definition`,
`simulate_path`, `capabilities`, `example_definitions`, `publish_form`). The Formhaus Claude Code plugin
starts the server. Without the plugin, it is added with
`claude mcp add formhaus -- npx -y @formhaus/mcp`.

- `capabilities` returns the current field types, validation rules, condition operators
  and step semantics. Prefer it over the reference below when they differ.
- `example_definitions` lists bundled example definitions and returns one by `id`.
- `validate_definition` checks a definition against the JSON Schema and the engine.
- `simulate_path` walks a multi-step definition with sample answers and reports the step path.
- `publish_form` publishes a definition to Formhaus Cloud and returns a live endpoint, a hosted page URL, an embed snippet and a React snippet.

If the tools are not available, validate by hand against the types below and tell the
user that `@formhaus/mcp` can check the result.

## Types Reference

These are the exact TypeScript types. Your output MUST conform to them.

```typescript
interface FormDefinition {
  id: string;           // kebab-case identifier
  formatVersion?: string; // "1.6" with randomize or a pinned option, "1.5" with {{key}} recall, an exclusive option or autocomplete, "1.4" with contains or notContains, "1.3" with scale, rating, option images or a matrix
  title: string;        // human-readable form title
  description?: string; // short intro under the title, up to 1000 characters
  submit: FormAction;   // submit button config (required)
  cancel?: FormAction;  // cancel button (optional)
  fields?: FormField[]; // single-step form
  steps?: FormStep[];   // multi-step form (use steps OR fields, not both)
}

interface FormStep {
  id: string;
  title: string;
  description?: string;
  fields: (FormField | FormSection)[]; // may be empty for a welcome or statement screen
  show?: ShowCondition[];    // step visible when ALL conditions true
  showAny?: ShowCondition[]; // step visible when ANY condition true
  routes?: StepRoute[];      // ordered forward destinations
  next?: FormAction | false; // custom "next" or false to hide it
  back?: FormAction | false; // custom "back" or false to hide it
  skip?: FormAction;         // Skip button: resets the step, moves on without validation
}

interface StepRoute {
  to: string | null;         // later step id, or terminal without auto-submission
  show?: ShowCondition[];
  showAny?: ShowCondition[];
}

interface FormField {
  key: string;                // camelCase field identifier
  type: FieldType;
  label: string;
  placeholder?: string;
  helperText?: string;
  defaultValue?: unknown;
  autoAdvance?: boolean;     // explicit activation advances; built-in radio, scale and rating support it
  show?: ShowCondition[];     // field visible when ALL conditions true
  showAny?: ShowCondition[];  // field visible when ANY condition true
  validation?: FieldValidation;
  options?: FieldOption[];    // for select, multiselect, radio; anchor labels on the first, middle and last point of scale and rating
  randomize?: boolean;        // select, multiselect, radio: random option order per respondent (format 1.6); code passes research from @formhaus/core/research, Cloud hosted pages include it
  layout?: 'stack' | 'inline'; // radio/multiselect; inline only for a few short options
  optionsFrom?: string;       // dynamic options loaded at runtime
  optionsDependsOn?: string[];
  accept?: string;            // for file type: "image/*", ".pdf"
  rows?: number;              // for textarea
  mask?: string;              // input mask
  inputMode?: 'text' | 'numeric' | 'decimal' | 'tel' | 'email' | 'url' | 'search';
  autocomplete?: string;      // HTML autofill token: given-name, family-name, email, tel, street-address, postal-code, off (format 1.5)
}

type FieldType =
  | 'text' | 'email' | 'phone' | 'number' | 'password'
  | 'select' | 'autocomplete' | 'multiselect'
  | 'checkbox' | 'radio' | 'switch'
  | 'file' | 'date' | 'datetime' | 'time' | 'textarea' | 'hidden'
  | 'scale'    // whole number from validation.min (0 or 1, default 1) to validation.max (default 5)
  | 'rating';  // stars from 1 to validation.max (default 5, 3 to 10)

interface FormSection {
  key: string;
  type: 'section';
  title: string;
  description?: string;
  layout?: 'matrix';          // grid: each field is a radio row with the same options
  show?: ShowCondition[];
  fields: FormField[];        // may be empty for a statement between questions
}

interface ShowCondition {
  field: string;                        // references another field's key
  eq?: string | number | boolean;       // equals
  neq?: string | number | boolean;      // not equals
  in?: (string | number)[];             // one of
  notIn?: (string | number)[];          // not one of
  contains?: string | number;           // multiselect answer includes this option
  notContains?: string | number;        // multiselect answer does not include it
  notEmpty?: boolean;                   // has a value
  gt?: number; gte?: number;            // numeric comparisons, such as an NPS score
  lt?: number; lte?: number;
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

interface FieldOption {
  value: string;   // on scale and rating anchors: the point number, such as "0" or "10"
  label: string;
  image?: string;  // image URL for radio and multiselect (picture choice)
  exclusive?: boolean; // multiselect only: picking it clears the other answers (format 1.5)
  pinned?: boolean;    // keeps its written position when the field has randomize (format 1.6)
}
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
- **Existing definition**: user references a bundled example (`example_definitions`)

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
- Searchable dropdowns, typeahead → `autocomplete`
- Country, city, currency → `select`
- Long text, "Description", "Notes", "Bio" → `textarea`
- Dates, birthdays, "When" → `date`
- Date and time together → `datetime`
- Time of day only, "Start time", "Opening hours" → `time`
- Tracking values the user never sees, "Source", "Campaign", "Referral code from the link" → `hidden`
- File upload, "Attach", "Upload" → `file`
- Toggle, "Enable/Disable", notifications → `switch`
- Numbers, amounts, quantities → `number`
- "How likely are you to recommend" with 0 to 10 → `scale` with `validation: { min: 0, max: 10 }` and anchors `"0": "Not at all likely"`, `"10": "Extremely likely"` (NPS)
- "Rate", "stars", satisfaction from 1 to 5 → `rating`
- "Strongly disagree … Strongly agree" or "1 to 7" for one statement → `scale` with start and end anchors
- Several statements with the same agree/disagree answers → a `section` with `layout: "matrix"` and one `radio` per statement, all with the same options
- Options shown as pictures → `radio` or `multiselect` with `image` on each option
- An intro, welcome or "thank you for joining" screen → a step with a title, a description, `next: { label: "Start" }` and `fields: []`
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

Output the complete form definition JSON. Follow these rules:

1. `id` is kebab-case derived from the title
2. `key` for each field is camelCase
3. Every form MUST have `submit: { label: "..." }`
4. Use `fields` for single-step, `steps` for multi-step
5. Only include optional properties when they add value (no empty strings, no `required: false`)
6. Options for select/radio must have both `value` and `label`
7. Set `"formatVersion": "1.6"` when a field has `randomize` or an option is `pinned`, else `"1.5"` when a text uses `{{key}}`, an option has `"exclusive": true` or a field has `autocomplete`, else `"1.4"` when a condition uses `contains` or `notContains`, else `"1.3"` when the form has a `scale`, a `rating`, an option `image` or a matrix section. Set at least `"1.1"` when it has sections or groups
8. Conditions on `scale` and `rating` compare numbers: `{ "field": "nps", "lte": 6 }`. A range is two conditions: `gte` and `lte`
9. A `multiselect` answer is a list. Test one option with `{ "field": "interests", "contains": "other" }`, never with `eq` or `in`
10. Show an earlier answer in a later step title or description, a label, `helperText` or `placeholder` with `{{key}}`, such as a review step: `"description": "Check your answers: {{name}}, {{email}}, plan {{plan}}"`. Recall only fields from earlier steps. It also works in a group `itemLabel`; password fields never recall
11. Use `"exclusive": true` on a "None of these" or "Prefer not to say" option of a `multiselect` and put it last

Put `"$schema": "https://formhaus.dev/schema/form-definition.json"` as the first key
so editors validate and autocomplete the file.

### Step 5: Validate

If the MCP tools are available:

1. Call `validate_definition` with the definition. Fix every entry in `errors` and
   re-run until `errors` is empty. Review `warnings` and fix the ones that are real mistakes.
2. For multi-step definitions with conditions or routes, call `simulate_path` with answers
   that take each branch and check that the path matches the user's intent.

### Step 6: Present and confirm

Show the generated JSON in a code block. Ask:

> "Here's your form definition. You can paste this directly into the
> Formhaus Figma plugin or use with FormRenderer."

Options:
- A) Looks good, copy and done
- B) Make changes (specify what)
- C) Publish it and get a live endpoint

If B: apply changes and re-present

### Step 7: Publish and wire into the project

Only when the user chose C, or asked for a working form, a hosted form or an endpoint.
Requires the `publish_form` tool and a definition that passed `validate_definition`.

1. Call `publish_form` with the definition. Hosted forms do not support `password`, `file`,
   `autocomplete`, `optionsFrom` and custom field types. If the tool reports an error, fix every
   listed path and call it again.
2. Tell the user the `hosted_url` and `endpoint`. Without an API key the form is unclaimed
   (7 days, 100 submissions): give them the `claim_url` from the result.
3. Detect the project: React or Vue in `package.json`, or plain HTML. Install the matching
   package (`@formhaus/react` or `@formhaus/vue`, plus `@formhaus/core` for `style.css`) with
   the project's package manager.
4. Add the `react_snippet` from the result where the user wants the form. It imports
   `FormhausForm` from `@formhaus/react/cloud`. For Vue use `FormhausForm` from
   `@formhaus/vue/cloud` with the same `id`. For plain HTML use `embed_snippet`.
5. Publishing again with the same `form_id` ships a new version at the same endpoint, so
   later edits to the definition do not change the project code.

## Example Definitions

Call `example_definitions` to list the bundled examples and fetch one by `id` when you
need to verify a pattern or show the user an example. They cover common field types,
validation, show conditions, linear steps, and branching steps with routes.

## Rules

- NEVER call `publish_form` unless the user asked for a hosted form or Formhaus Cloud. If the project has its own backend, render with `FormRenderer` and submit to that backend.
- NEVER output invalid JSON. Validate before presenting, with `validate_definition` when available.
- NEVER invent field types not in the FieldType union.
- NEVER use `fields` AND `steps` in the same definition. Pick one.
- Keys must be unique within a definition (across all steps).
- ShowCondition.field must reference an existing field key.
- For multi-step: each step needs `id`, `title`, and `fields`.
- Submit label should match the form's purpose ("Submit", "Create transfer", "Register", etc.).

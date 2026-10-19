---
title: "Field types"
description: "Formhaus field types: text, select, multiselect, radio, scale, rating, picture choice, checkbox, switch, date, time, file, hidden and custom components."
---

# Field Types

Each field `type` maps to a UI component. Default adapters use native HTML elements. Override any field type with your own component via the `components` prop.

## Text fields

Types `text`, `email`, `phone`, `number`, `password` all render a text input. The `type` controls the HTML input type and keyboard on mobile.

```json
{
  "key": "email",
  "type": "email",
  "label": "Email address",
  "placeholder": "you@example.com",
  "validation": {
    "required": true,
    "pattern": "^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$",
    "patternMessage": "Enter a valid email"
  }
}
```

`number` renders `<input type="number">` and stores a number, or `null` when the user clears the input.

The `email` type checks the format in the browser and in `validateSubmission()` from `@formhaus/core/server`. A `pattern` as above adds a stricter rule.

`inputMode` controls the mobile keyboard without changing the field type:

```json
{
  "key": "zipCode",
  "type": "text",
  "label": "Zip code",
  "inputMode": "numeric",
  "validation": { "pattern": "^[0-9]{5}$" }
}
```

`mask` provides a pattern hint. The default TextField uses it as a placeholder when no `placeholder` is set. Custom components receive `field.mask` and can implement full input masking:

```json
{
  "key": "phone",
  "type": "phone",
  "label": "Phone number",
  "mask": "(###) ###-####"
}
```

## Select

Dropdown with predefined options. Define options inline or load them dynamically.

```json
{
  "key": "country",
  "type": "select",
  "label": "Country",
  "placeholder": "Select a country",
  "options": [
    { "value": "US", "label": "United States" },
    { "value": "DE", "label": "Germany" },
    { "value": "JP", "label": "Japan" }
  ],
  "validation": { "required": true }
}
```

For dynamic options (e.g. loading data from an API), use `optionsFrom`:

```json
{
  "key": "category",
  "type": "select",
  "label": "Category",
  "optionsFrom": "categories",
  "optionsDependsOn": ["type"]
}
```

Then pass the provider to the renderer:

::: code-group
```vue [Vue]
<template>
  <FormRenderer
    :definition="definition"
    :options-providers="{ categories: loadCategories }"
    @submit="onSubmit"
  />
</template>
```

```tsx [React]
<FormRenderer
  definition={definition}
  optionsProviders={{ categories: loadCategories }}
  onSubmit={handleSubmit}
/>
```
:::

The provider receives all current values and can return options directly or through a Promise:

```ts
import type { OptionsProvider } from '@formhaus/react'; // or @formhaus/vue

const loadCategories: OptionsProvider = async (values) => {
  const response = await fetch(`/api/categories?type=${values.type ?? ''}`);
  return response.json();
};
```

The renderer calls the provider when the field appears and whenever a field listed in `optionsDependsOn` changes. If requests overlap, only the latest result is used. A rejected request leaves the previous options in place and retries after the next dependency change.

## Autocomplete

Type-to-filter dropdown for long option lists. Default renderer uses `<input type="text">` with a `<datalist>` — native browser filtering, SSR-safe. Same `options` shape as `select` (and `optionsFrom` works the same way). For richer pickers (MUI `Autocomplete`, Headless UI `Combobox`) plug in your own component via `components`.

```json
{
  "key": "country",
  "type": "autocomplete",
  "label": "Country",
  "placeholder": "Type to filter…",
  "options": [
    { "value": "US", "label": "United States" },
    { "value": "DE", "label": "Germany" }
  ]
}
```

The field stores the option `value`. The input shows the matching `label`, also when the value comes from `initialValues` or `setValue()` before `optionsFrom` resolves. A value that matches no option is shown as is.

The suggestions list and filter by `label`. Typing or picking a label stores its `value`. Other text is stored as typed.

::: warning Native `<datalist>` quirks
The default renderer uses the browser's `<datalist>` element. The input does not enforce that the value is in the list: users can type anything. If you need "must be one of the options", add a custom validator or use a custom component (MUI Autocomplete, Headless UI Combobox).
:::

## Multiselect

Pick multiple from a list. Renders as a checkbox group. The value is an array of selected option values.

```json
{
  "key": "interests",
  "type": "multiselect",
  "label": "Interests",
  "options": [
    { "value": "tech", "label": "Technology" },
    { "value": "design", "label": "Design" },
    { "value": "music", "label": "Music" }
  ],
  "validation": { "required": true, "minLength": 1, "maxLength": 3 }
}
```

`minLength` / `maxLength` on multiselect controls how many options can be selected. A value that repeats an option fails validation, so `minLength: 3` needs three different options.

Options stack vertically. Set `"layout": "inline"` to place short options side by side, as with radio. `layout` was added in 0.10.0.

## Checkbox

Boolean toggle with a label.

```json
{
  "key": "termsAccepted",
  "type": "checkbox",
  "label": "I accept the Terms of Service",
  "validation": { "required": "You must accept the terms" }
}
```

`required` rejects an unchecked box, so the user must check it to continue.

## Radio

Pick one from a list. Options stack vertically, one full-width row per option.

```json
{
  "key": "accountType",
  "type": "radio",
  "label": "Account type",
  "options": [
    { "value": "personal", "label": "Personal" },
    { "value": "business", "label": "Business" }
  ],
  "validation": { "required": true }
}
```

For a few short options, such as `1 year` or `2 years`, set `"layout": "inline"`. Options then sit side by side and wrap on narrow screens. Keep the default `stack` for options longer than a few words. `layout` was added in 0.10.0.

## Scale

Pick one number on a range, such as 1 to 5. Renders as a row of numbered boxes. The value is the number. Requires `@formhaus/core` 0.19 and `"formatVersion": "1.3"`.

```json
{
  "key": "ease",
  "type": "scale",
  "label": "How easy was the setup?",
  "validation": { "required": true, "min": 1, "max": 5 },
  "options": [
    { "value": "1", "label": "Very hard" },
    { "value": "5", "label": "Very easy" }
  ]
}
```

- `validation.min` and `validation.max` set the range. They default to 1 and 5. Use `min` 0 or 1 and 3 to 11 points. Bounds that are not whole numbers, or fewer than 2 or more than 11 points, are an `invalid-scale` error.
- A value outside the range or not a whole number fails with `Select one of the available options`.
- `options` are optional anchor labels. `value` is the point number as a string. The label of the first point sits under the start of the row, the last point under the end and the middle point, `floor((min + max) / 2)`, in the center. Labels on other points are not shown.
- Digit keys select a point. Arrow keys move between points. With `autoAdvance`, a click, Space, Enter or a digit key moves to the next step.

### NPS

An NPS question is a scale from 0 to 10. `0` counts as an answer for `required`.

```json
{
  "key": "nps",
  "type": "scale",
  "label": "How likely are you to recommend us to a friend?",
  "validation": { "required": true, "min": 0, "max": 10 },
  "options": [
    { "value": "0", "label": "Not at all likely" },
    { "value": "10", "label": "Extremely likely" }
  ]
}
```

Show a follow-up for detractors with `{ "field": "nps", "lte": 6 }` and for promoters with `{ "field": "nps", "gte": 9 }`. See [Conditions](/guide/conditions#example-nps-follow-up).

## Rating

Pick a number of stars. The value is the number of stars. Requires `@formhaus/core` 0.19 and `"formatVersion": "1.3"`.

```json
{
  "key": "stars",
  "type": "rating",
  "label": "Rate your stay",
  "validation": { "required": true, "max": 5, "min": 2, "minMessage": "Pick at least 2 stars" }
}
```

- `validation.max` sets the number of stars, 5 by default. Use 3 to 10. A `max` outside 2 to 11 is an `invalid-scale` error.
- `validation.min` is an ordinary rule: a rating below it fails with the `min` message.
- `options` work as anchor labels, as on a scale.
- Keyboard and `autoAdvance` work as on a scale. Screen readers announce the star number.

## Picture choice

Add `image` to the options of a `radio` or `multiselect` field. The options become a grid of cards with the picture above the label. Requires `@formhaus/core` 0.19.

```json
{
  "key": "room",
  "type": "radio",
  "label": "Which room did you book?",
  "columns": 2,
  "options": [
    { "value": "garden", "label": "Garden suite", "image": "https://example.com/garden.jpg" },
    { "value": "sea", "label": "Sea view", "image": "https://example.com/sea.jpg" }
  ]
}
```

- The value is the option `value`, as without images.
- The label stays visible and names the option for screen readers, so the image has an empty `alt`.
- Images load lazily from the URL as given. Allow their host in `img-src` if the page has a Content Security Policy.
- The image host sees the respondent's IP address. The built-in renderers send no `Referer` header. `checkDefinition()` warns about an `image` that is not an `https:` or `data:image/` URL with `unsafe-image-url`.
- `select` and `autocomplete` ignore `image`.
- `columns` sets the cards per row, from 1 to 4. Without it, cards are about 200px wide and fill the row. Phones show at most 2 per row.
- The button in the corner of each image opens it at full size. Esc, a click outside or the close button closes it.

## Switch

Boolean toggle, styled as a switch. Same behavior as checkbox but different UI.

```json
{
  "key": "darkMode",
  "type": "switch",
  "label": "Dark mode"
}
```

## Textarea

Multi-line text input. Set `rows` to control the height.

```json
{
  "key": "description",
  "type": "textarea",
  "label": "Description",
  "helperText": "Provide additional details",
  "rows": 4,
  "validation": { "required": true, "minLength": 20 }
}
```

## Date

Date picker. Uses native `<input type="date">` for now. Emits `YYYY-MM-DD`.

```json
{
  "key": "birthDate",
  "type": "date",
  "label": "Date of birth"
}
```

## Datetime

Date and time picker. Uses native `<input type="datetime-local">`. Emits `YYYY-MM-DDTHH:mm` (browser default; no timezone). For richer pickers (calendar UI, timezone-aware ISO output) plug in your own component via `components`.

```json
{
  "key": "expiresAt",
  "type": "datetime",
  "label": "Expires at"
}
```

::: warning Timezone gotcha
`<input type="datetime-local">` emits `YYYY-MM-DDTHH:mm` with **no timezone**. Most APIs expect ISO 8601 with a timezone offset (`2026-05-10T14:30:00Z` or `…+02:00`). If you POST the raw value to a backend that assumes UTC, you'll silently store the wrong instant for any user not in UTC.

Two ways to fix on submit:

```ts
function toISO(local: string): string {
  return new Date(local).toISOString();
}

<FormRenderer
  definition={definition}
  onSubmit={(values) => api.post({ ...values, expiresAt: toISO(values.expiresAt as string) })}
/>
```

Or plug in a custom component (MUI `DateTimePicker`, react-aria `DateField`) that emits ISO directly.
:::

## Time

Time picker. Uses native `<input type="time">`. Emits `HH:mm` in 24-hour time, or `HH:mm:ss` when the browser shows seconds.

```json
{
  "key": "startsAt",
  "type": "time",
  "label": "Start time"
}
```

The browser and `validateSubmission()` accept `00:00` to `23:59:59` and reject anything else, such as `24:00`, `9:30` or `9:30 PM`, with the `time` message.

## File

File upload. Uses native file input. Set `accept` to restrict file types. With [Formhaus Cloud](/guide/endpoint#files), `FormhausForm` uploads the file and submits its id.

```json
{
  "key": "document",
  "type": "file",
  "label": "Upload document",
  "accept": "image/*,.pdf"
}
```

## Hidden

A value sent with the answers that the user never sees. It renders `<input type="hidden">`: no label, no helper text, nothing to focus. The value comes from the initial values, a [source](#value-sources) or `defaultValue`.

```json
{
  "key": "source",
  "type": "hidden",
  "label": "Signup source",
  "defaultValue": "website"
}
```

`label` is optional. Editors and error messages use it, and fall back to the key without one.

### Value sources

`source` fills a hidden field from where the respondent came from. The React and Vue renderers read it in the browser after mount.

```json
{
  "key": "utm_source",
  "type": "hidden",
  "label": "UTM source",
  "source": { "query": "utm_source" }
}
```

| `source` | Value |
|---|---|
| `{ "query": "name" }` | The URL parameter `name`, such as `utm_campaign`, `ref`, `gclid` or `fbclid` |
| `"referrer"` | `document.referrer` without the query string and hash. Browsers usually send only the origin of another site |
| `"page"` | The page URL without the query string and hash, such as `https://example.com/pricing` |
| `"pageTitle"` | `document.title` |
| `"language"` | `navigator.language`, such as `de-DE` |
| `"timezone"` | The time zone name, such as `Europe/Berlin` |
| `"device"` | `mobile`, `tablet` or `desktop`, from the pointer type and the viewport size |
| `"country"` | A two-letter ISO country code. Formhaus Cloud fills it at submission. On your own server, write it into the values before `validateSubmission()`. In the browser it yields nothing |

For a fixed value, such as `"campaign": "black-friday"`, use `defaultValue` without `source`.

The value of a hidden field comes from, in order:

1. The initial values your app passes, including a restored draft. `""` and `null` count as missing.
2. Its `source`.
3. Its `defaultValue`.
4. Nothing: the key is left out of the submit values. It is never sent as `""`, `"undefined"` or `"null"`.

A source yields nothing when the parameter is missing or empty, there is no referrer, or the browser blocks the API. Values are trimmed, cut to `validation.maxLength` or else 2000 characters, and an empty string counts as nothing. A source that fails does not affect the other fields or the form. Filling a value does not call `onFieldChange`. The server render and the first client render use `defaultValue`, so hydration matches.

Inside an iframe, `query` and `page` read the URL of the iframe, and `referrer` is usually the embedding page.

Anyone can edit the URL, so treat these values as untrusted input. Do not mark tracking fields as `required` or give them `pattern` or `minLength` rules: when a visitor arrives without the parameter, or with an edited one, the rule blocks the form with an error the visitor cannot fix.

Sources never include the user agent string, screen size or other values that identify a device. To collect something else, pass it in initial values.

Without the built-in renderers, `resolveSources()` returns the values to pass as initial values:

```ts
import { FormEngine, resolveSources } from '@formhaus/core';

const sourced = resolveSources(definition, {
  search: location.search,
  href: location.href,
  referrer: document.referrer,
});
const engine = new FormEngine(definition, { ...sourced, ...initialValues });
```

Context keys are `search`, `href`, `referrer`, `pageTitle`, `language`, `timezone`, `device` and `country`. A missing key yields nothing.

A hidden field follows the same rules as any other field:

- `show` and `showAny` apply. While its conditions fail, the value is cleared and left out of the submit values. When the conditions match again, the field gets its initial value or `defaultValue` back, even after an edit. Other field types get back their last value.
- `validation` rules run, and `validateSubmission()` checks the value as text of up to `maxLength`, or 2000 characters without it. A number or a list fails with the `string` message.
- An error on a hidden field shows as a form-level error, in `engine.topLevelErrors`, because the user has nothing to fix. It never appears in the error summary, in step error marks or as a focus target. `engine.errors` and `engine.validate()` still list it under its key.
- Built-in messages name the field, such as `Signup source: This field is required`. The `hidden` message template, `{label}: {message}`, controls the format and is translated like other [messages](/guide/translations). The key stands in for an empty label. Messages you write, such as a string `required` or `patternMessage`, stay as written.

Server errors returned for a hidden field's key also show as form-level errors, as sent. `validateSubmission()` already names the field in them.

## Answer recall

`{{key}}` in a text shows the answer to an earlier field. Set `"formatVersion": "1.5"`. Requires `@formhaus/core` 0.21.

```json
{
  "formatVersion": "1.5",
  "id": "signup",
  "title": "Sign up",
  "submit": { "label": "Send" },
  "steps": [
    {
      "id": "about",
      "title": "About you",
      "fields": [
        { "key": "name", "type": "text", "label": "Name" },
        { "key": "email", "type": "email", "label": "Email" },
        {
          "key": "plan",
          "type": "radio",
          "label": "Plan",
          "options": [
            { "value": "pro", "label": "Pro" },
            { "value": "team", "label": "Team" }
          ]
        }
      ]
    },
    {
      "id": "review",
      "title": "Review",
      "description": "Check your answers: {{name}}, {{email}}, plan {{plan}}",
      "fields": []
    }
  ]
}
```

A step can greet the user by the name asked on the first step:

```json
{ "id": "more", "title": "Hello, {{name}}!", "description": "A few more questions.", "fields": [] }
```

- Tokens work in step and section `title` and `description`, field and group `label` and `helperText`, and `placeholder`.
- Options show their label from the definition `options`, and a value from `optionsFrom` shows as stored. A multiselect joins labels with `, `, a checkbox or switch shows its label when on, and a group shows its item count.
- A missing value, a hidden field and an unknown key give an empty text.
- `checkDefinition()` warns when a token names no field or a field answered later.
- Inside a group item, `{{key}}` also reads the item's own fields.
- The [Derived values](/recipes/derived-values#use-a-computed-value-later-in-the-form) recipe fills a `hidden` field from app code and recalls it.

## Keys and element ids

Submitted values use each field's key exactly as written. A key such as `contact.email` stays one flat key and is never split into nested objects. Errors from `validateSubmission()` and the `errors` prop use the same keys.

Each field control gets the element id `<form id>-<key>`, and its error message gets the same id plus `-error`. The form id is generated per renderer, so match the end of the id, such as `[id$="-email"]`. In the key part, each character other than `A-Z`, `a-z`, `0-9`, `_` and `-` becomes `-`, so `contact.email` gets `<form id>-contact-email`.

When two keys in one form escape to the same id, such as `contact.email` and `contact-email`, the key that needs no escaping keeps the plain id. If both need escaping, the key that sorts first keeps it. The other key gets `-` and a short hash of the key added, such as `<form id>-contact-email-1k2j3h4`. The hash depends only on the key, so reordering fields does not change ids.

## Custom field types

`FieldType` accepts any string, not just the built-in types. Name custom types with `-` or `:`, such as `x-rating` or `acme:rating`. Built-in types are single words, and names with `-` or `:` never become built-in types. `checkDefinition()` warns about a custom type without them with `custom-type-name`.

Use the `components` prop to provide a renderer for your custom type:

::: code-group
```vue [Vue]
<template>
  <FormRenderer
    :definition="definition"
    :components="{ 'color-picker': ColorPicker }"
    @submit="onSubmit"
  />
</template>
```

```tsx [React]
<FormRenderer
  definition={definition}
  components={{ 'color-picker': ColorPickerField }}
  onSubmit={handleSubmit}
/>
```
:::

In the definition:

```json
{
  "key": "brandColor",
  "type": "color-picker",
  "label": "Brand color"
}
```

If no component is registered for a type, the form shows an "Unsupported field type" placeholder. In development the placeholder names the type, and the renderer warns once per type with the code `missing-component` and lists the registered types. The warning goes to `onWarning` when you pass it, or else to the console.

Put the settings of a custom type in `props`. Core ignores them, and the component reads them from `field.props`:

```json
{
  "key": "brandColor",
  "type": "color-picker",
  "label": "Brand color",
  "props": { "swatches": ["#111111", "#f5f5f5"], "allowAlpha": false }
}
```

## Override default components

Override any built-in field type by passing a `components` prop:

::: code-group
```vue [Vue]
<template>
  <FormRenderer
    :definition="definition"
    :components="{ phone: CustomPhoneInput }"
    @submit="onSubmit"
  />
</template>
```

```tsx [React]
<FormRenderer
  definition={definition}
  components={{ phone: CustomPhoneInput }}
  onSubmit={handleSubmit}
/>
```
:::

Each custom component gets the field descriptor, the current value, and validation state:

| Prop | Type | Description |
|------|------|-------------|
| `field` | `FormField` | Field descriptor (`key`, `label`, `options`, etc.) |
| `value` | `unknown` | Current value |
| `error` | `string?` | Validation error, if any |
| `loading` | `boolean?` | Field loading state set through `FormEngine.setFieldLoading()` |
| `disabled` | `boolean?` | Form is disabled |

Put the `id` prop on the control, so the label and error messages stay linked. In React, call `onChange(value)` and `onBlur()`. In Vue, read `modelValue` and emit `update:modelValue` and `blur`, so `v-model` works on the component.

### Explicit field activation

For a deliberate activation that may advance a step, React fields call the optional `onCommit(value)` callback; Vue fields emit `commit` with the value. This saves the value and, when `field.autoAdvance` is true, validates and advances a non-final step. Emit only the commit event for an activation, because it also updates the value. Ordinary edits use `onChange`/`update:modelValue` and never navigate.

The built-in radio activates on click, Space or Enter; arrows only change the selection. A custom radio should preserve that distinction and allow the selected option to be activated again after a cancelled guard. Respect `disabled` while hooks or submission are pending. See the [complete radio example](/guide/steps#advance-when-an-answer-is-activated).

### React example

```tsx
import type { FieldComponentProps } from '@formhaus/react'

export function CustomPhoneInput({ field, value, error, disabled, onChange, onBlur }: FieldComponentProps) {
  return (
    <div>
      <label>{field.label}</label>
      <input
        type="tel"
        value={(value as string) ?? ''}
        placeholder={field.placeholder}
        disabled={disabled}
        onChange={(e) => onChange(e.target.value)}
        onBlur={onBlur}
      />
      {field.helperText && <span>{field.helperText}</span>}
      {error && <span className="error">{error}</span>}
    </div>
  )
}
```

### Vue example

```vue
<script setup lang="ts">
import { formFieldEmits, formFieldProps } from '@formhaus/vue'

const props = defineProps(formFieldProps)
const emit = defineEmits(formFieldEmits)
</script>

<template>
  <div>
    <label>{{ props.field.label }}</label>
    <input
      type="tel"
      :value="(props.modelValue as string) ?? ''"
      :placeholder="props.field.placeholder"
      :disabled="props.disabled"
      @input="emit('update:modelValue', ($event.target as HTMLInputElement).value)"
      @blur="emit('blur')"
    />
    <span v-if="props.field.helperText">{{ props.field.helperText }}</span>
    <span v-if="props.error" class="error">{{ props.error }}</span>
  </div>
</template>
```

`formFieldProps` and `formFieldEmits` are runtime declarations with full types, so the SFC compiler does not need to resolve a type from the package. `defineProps<FormFieldProps>()` fails in some setups because the compiler cannot follow the types of `@formhaus/vue` and `@formhaus/core`. See [Runtime props in Vue](/guide/custom-components#runtime-props-in-vue).

`field` has everything from the definition: `key`, `type`, `label`, `placeholder`, `helperText`, `options`, `validation`. Full type in the [Definition Reference](/api/definition).

## Default values

`defaultValue` fills the field when the initial values have no entry for its key:

```json
{ "key": "country", "type": "text", "label": "Country", "defaultValue": "DE" }
```

Skip resets the fields of a step to their defaults.

## Nested keys

Field keys are flat strings. `key: "name"` maps to `values.name` in the submit output. If you use a dot in the key (`key: "address.city"`), it stays flat — the submitted value is `{ "address.city": "Berlin" }`, not `{ address: { city: "Berlin" } }`.

This is intentional. Most forms don't need nested data, and flat keys keep the engine simple. If your backend expects nested objects, reshape the values in your `onSubmit` handler.

For arrays of items, use a [repeatable group](/guide/groups). Its item fields use paths such as `participants.1.email`.

## Next steps

- [Validation](/guide/validation): add rules to your fields
- [Conditional Fields](/guide/conditions): show/hide fields based on values
- [Custom Actions & Progress](/guide/custom-components): replace the built-in buttons and step progress
- [Figma Plugin](/guide/figma): use these field types in Figma mockups

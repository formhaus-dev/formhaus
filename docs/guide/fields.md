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
    :schema="schema"
    :options-providers="{ categories: loadCategories }"
    @submit="onSubmit"
  />
</template>
```

```tsx [React]
<FormRenderer
  schema={schema}
  optionsProviders={{ categories: loadCategories }}
  onSubmit={handleSubmit}
/>
```
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

`minLength` / `maxLength` on multiselect controls how many options can be selected.

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

## Radio

Pick one from a list. Options render vertically.

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

Date picker. Uses native `<input type="date">` for now.

```json
{
  "key": "birthDate",
  "type": "date",
  "label": "Date of birth"
}
```

## File

File upload. Uses native file input. Set `accept` to restrict file types.

```json
{
  "key": "document",
  "type": "file",
  "label": "Upload document",
  "accept": "image/*,.pdf"
}
```

## Custom field types

`FieldType` accepts any string, not just the built-in types. Use the `components` prop to provide a renderer for your custom type:

::: code-group
```vue [Vue]
<template>
  <FormRenderer
    :schema="schema"
    :components="{ 'color-picker': ColorPicker }"
    @submit="onSubmit"
  />
</template>
```

```tsx [React]
<FormRenderer
  schema={schema}
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

If no component is registered for a type, the form shows "Unsupported field type."

## Override default components

Override any built-in field type by passing a `components` prop:

::: code-group
```vue [Vue]
<template>
  <FormRenderer
    :schema="schema"
    :components="{ phone: CustomPhoneInput }"
    @submit="onSubmit"
  />
</template>
```

```tsx [React]
<FormRenderer
  schema={schema}
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
| `loading` | `boolean?` | Field is loading (async options) |
| `disabled` | `boolean?` | Form is disabled |

In React, call `onChange(value)` and `onBlur()`. In Vue, emit `update:value` and `blur`.

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
import type { FormFieldProps } from '@formhaus/vue'

const props = defineProps<FormFieldProps>()
const emit = defineEmits<{
  (e: 'update:value', value: unknown): void
  (e: 'blur'): void
}>()
</script>

<template>
  <div>
    <label>{{ props.field.label }}</label>
    <input
      type="tel"
      :value="(props.value as string) ?? ''"
      :placeholder="props.field.placeholder"
      :disabled="props.disabled"
      @input="emit('update:value', ($event.target as HTMLInputElement).value)"
      @blur="emit('blur')"
    />
    <span v-if="props.field.helperText">{{ props.field.helperText }}</span>
    <span v-if="props.error" class="error">{{ props.error }}</span>
  </div>
</template>
```

`field` has everything from the definition: `key`, `type`, `label`, `placeholder`, `helperText`, `options`, `validation`. Full type in the [Definition Reference](/api/definition).

## Nested keys

Field keys are flat strings. `key: "name"` maps to `values.name` in the submit output. If you use a dot in the key (`key: "address.city"`), it stays flat — the submitted value is `{ "address.city": "Berlin" }`, not `{ address: { city: "Berlin" } }`.

This is intentional. Most forms don't need nested data, and flat keys keep the engine simple. If your backend expects nested objects, reshape the values in your `onSubmit` handler.

Repeatable field groups (arrays of items) are not supported yet.

## Next steps

- [Validation](/guide/validation): add rules to your fields
- [Conditional Fields](/guide/conditions): show/hide fields based on values
- [Custom Actions & Progress](/guide/custom-components): replace the built-in buttons and step progress
- [Figma Plugin](/guide/figma): use these field types in Figma mockups

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

## Custom field components

Override any field type by passing a `components` prop:

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

Each custom component gets the field definition from the schema, the current value, and validation state:

| Prop | Type | Description |
|------|------|-------------|
| `field` | `FormField` | Field object from the schema (`key`, `label`, `options`, etc.) |
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

`field` has everything from the schema: `key`, `type`, `label`, `placeholder`, `helperText`, `options`, `validation`. Full type in the [Schema Reference](/api/schema).

## Next steps

- [Validation](/guide/validation): add rules to your fields
- [Conditional Fields](/guide/conditions): show/hide fields based on values
- [Custom Actions & Progress](/guide/custom-components): replace the built-in buttons and step progress
- [Figma Plugin](/guide/figma): use these field types in Figma mockups

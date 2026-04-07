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

Your custom component receives the same props as the built-in field components: `field`, `value`, `error`, `loading`, `disabled`, plus `onChange`/`onBlur` callbacks.

## Next steps

- [Validation](/guide/validation): add rules to your fields
- [Conditional Fields](/guide/conditions): show/hide fields based on values
- [Figma Plugin](/guide/figma): use these field types in Figma mockups

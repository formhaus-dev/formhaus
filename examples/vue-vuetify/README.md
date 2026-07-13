# Vue + Vuetify example

This example maps Formhaus `FormFieldProps` to [Vuetify 3](https://vuetifyjs.com) inputs through the `components` prop.

## Run

This example installs its own dependencies (it ignores the workspace root):

```bash
pnpm install --ignore-workspace
pnpm dev
```

Opens at http://localhost:5173.

## Files

- [src/component-map.ts](src/component-map.ts) maps each Formhaus field type to a Vuetify renderer.
- [src/fields/AutocompleteField.vue](src/fields/AutocompleteField.vue) filters by `label`, unlike the default `<datalist>`, which filters by `value`.
- [src/fields/SelectField.vue](src/fields/SelectField.vue) handles both `select` and `multiselect`.
- [src/fields/TextField.vue](src/fields/TextField.vue) handles text, email, phone, number, password, date, and datetime fields with Vuetify's `<v-text-field>`.
- [src/definition.json](src/definition.json) is the contact form used by the example.

## Use as a starter

Copy the folder, then change `definition.json` and the field map. The example resolves its Formhaus dependencies from npm.

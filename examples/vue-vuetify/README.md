# Vue + Vuetify example

Wires the Formhaus Vue adapter to [Vuetify 3](https://vuetifyjs.com) components. Demonstrates the `components` prop pattern: each Vuetify input is a thin wrapper that maps `FormFieldProps` onto the Vuetify API.

## Run

This example installs its own dependencies (it ignores the workspace root):

```bash
pnpm install --ignore-workspace
pnpm dev
```

Opens at http://localhost:5173.

## What's interesting

- [src/component-map.ts](src/component-map.ts) — maps every Formhaus field type to a Vuetify-backed renderer. Copy this file as a starting point for your own Vuetify-based form.
- [src/fields/AutocompleteField.vue](src/fields/AutocompleteField.vue) — Vuetify's `<v-autocomplete>` filtering by `label` (the default `<datalist>` filters by `value`).
- [src/fields/SelectField.vue](src/fields/SelectField.vue) — handles both `select` and `multiselect` from one component.
- [src/fields/TextField.vue](src/fields/TextField.vue) — covers text, email, phone, number, password, date, datetime in one renderer using Vuetify's `<v-text-field>`.
- [src/definition.json](src/definition.json) — a small contact form using `text`, `email`, `autocomplete`, and `datetime`.

## Use as a starter

Copy this folder, rename, and tweak `definition.json` and the field map. Nothing in here references workspace-internal paths.

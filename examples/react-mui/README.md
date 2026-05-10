# React + MUI example

Wires the Formhaus React adapter to [Material UI](https://mui.com) components. Demonstrates the `components` prop pattern: each MUI input is a thin wrapper that maps `FieldComponentProps` onto the MUI API.

## Run

This example installs its own dependencies (it ignores the workspace root):

```bash
pnpm install --ignore-workspace
pnpm dev
```

Opens at http://localhost:5173.

## What's interesting

- [src/component-map.ts](src/component-map.ts) — maps every Formhaus field type to an MUI-backed renderer. Copy this file as a starting point for your own MUI-based form.
- [src/fields/AutocompleteField.tsx](src/fields/AutocompleteField.tsx) — MUI's `<Autocomplete>` filtering by `label` (the default `<datalist>` filters by `value`).
- [src/fields/SelectField.tsx](src/fields/SelectField.tsx) — handles both `select` and `multiselect` from one component.
- [src/fields/TextField.tsx](src/fields/TextField.tsx) — covers text, email, phone, number, password, date, datetime in one renderer using MUI's `<TextField>`.
- [src/definition.json](src/definition.json) — a small contact form using `text`, `email`, `autocomplete`, and `datetime`.

## Use as a starter

Copy this folder, rename, and tweak `definition.json` and the field map. Nothing in here references workspace-internal paths.

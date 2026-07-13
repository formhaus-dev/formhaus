# React + MUI example

This example maps Formhaus `FieldComponentProps` to [Material UI](https://mui.com) inputs through the `components` prop.

## Run

This example installs its own dependencies (it ignores the workspace root):

```bash
pnpm install --ignore-workspace
pnpm dev
```

Opens at http://localhost:5173.

## Files

- [src/component-map.ts](src/component-map.ts) maps each Formhaus field type to an MUI renderer.
- [src/fields/AutocompleteField.tsx](src/fields/AutocompleteField.tsx) filters by `label`, unlike the default `<datalist>`, which filters by `value`.
- [src/fields/SelectField.tsx](src/fields/SelectField.tsx) handles both `select` and `multiselect`.
- [src/fields/TextField.tsx](src/fields/TextField.tsx) handles text, email, phone, number, password, date, and datetime fields with MUI's `<TextField>`.
- [src/definition.json](src/definition.json) is the contact form used by the example.

## Use as a starter

Copy the folder, then change `definition.json` and the field map. The example resolves its Formhaus dependencies from npm.

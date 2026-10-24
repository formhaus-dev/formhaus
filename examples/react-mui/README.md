# React + MUI example

This example maps Formhaus `FieldComponentProps` to [Material UI](https://mui.com) inputs through the `components` prop.

## Run

This example is its own pnpm workspace and installs `@formhaus/*` from npm:

```bash
pnpm install
pnpm dev
```

Opens at http://localhost:5173.

## Files

- [src/component-map.tsx](src/component-map.tsx) maps the field types to MUI controls with `mapControls`, one entry per type. `TextField` covers the text inputs, `select` and `multiselect`; `Checkbox`, `Switch`, `RadioGroup` and `Rating` cover the rest.
- [src/fields/shells.tsx](src/fields/shells.tsx) holds the shells that draw the label, helper text and error around checkboxes, option groups and the file picker, which opens a file input from a `Button`.
- [src/fields/options.tsx](src/fields/options.tsx) draws image tiles and scale segments. [MatrixRow.tsx](src/fields/MatrixRow.tsx) is a table row inside a matrix section.
- [src/fields/AutocompleteField.tsx](src/fields/AutocompleteField.tsx) uses MUI `Autocomplete` with `freeSolo`, so typed text that matches no option is kept.
- [src/definition.json](src/definition.json) is the contact form used by the example.

## Use as a starter

Copy the folder, then change `definition.json` and the field map. The example resolves its Formhaus dependencies from npm.

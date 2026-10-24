# React + Mantine example

This example maps every Formhaus field type to [Mantine](https://mantine.dev) components through the `components` prop, and renders steps, errors, sections, groups and the remove dialog with Mantine through the `layout` prop.

## Run

This example is its own pnpm workspace and installs `@formhaus/*` from npm:

```bash
pnpm install
pnpm dev
```

Opens at http://localhost:5173. The color scheme follows the system setting.

## Files

- [src/App.tsx](src/App.tsx) wraps the form in `MantineProvider` and shows the submitted values.
- [src/component-map.tsx](src/component-map.tsx) maps field types to Mantine controls with `mapControls`, one line per type. Mantine inputs render their own label, description and error from [src/fields/labels.tsx](src/fields/labels.tsx).
- [src/fields/GroupShell.tsx](src/fields/GroupShell.tsx) labels radio, scale and rating groups.
- [src/fields/MatrixRow.tsx](src/fields/MatrixRow.tsx) renders a table row inside a matrix section.
- [src/fields/AutocompleteField.tsx](src/fields/AutocompleteField.tsx) and [FileField.tsx](src/fields/FileField.tsx) wrap `Autocomplete` and `FileInput`.
- [src/layout](src/layout) holds the `layout` slots: `Stepper` progress, `Button` actions, `Alert` error summary, `Fieldset` sections with a `Table` for matrix sections, `Card` group items and a `Modal` remove dialog.
- [src/definition.json](src/definition.json) is a three-step account form.

## Use as a starter

Copy the folder, then change `definition.json`. `src/playground.ts` only connects the app to the docs playground. Delete it together with the `listenToPlayground` call in `src/main.tsx`.

# React + USWDS example

This example renders Formhaus forms with the [U.S. Web Design System](https://designsystem.digital.gov). USWDS has no official React package, so the components here render USWDS markup and classes from [`@uswds/uswds`](https://www.npmjs.com/package/@uswds/uswds). React owns the state, so the page loads no USWDS JavaScript and no Formhaus CSS.

## Run

This example is its own pnpm workspace and installs `@formhaus/*` from npm:

```bash
pnpm install
pnpm dev
```

Opens at http://localhost:5173. USWDS has no dark theme, so the page is light only.

## Files

- [src/styles.scss](src/styles.scss) compiles only the USWDS packages the form uses, with Public Sans as the only typeface.
- [src/component-map.tsx](src/component-map.tsx) maps each Formhaus field type to a USWDS control with `mapControls`, one entry per type.
- [src/layout/index.ts](src/layout/index.ts) maps the layout slots: step indicator, error alert with links, fieldsets, cards for group items, modal for the remove dialog, button group for actions.
- [src/fields/Shell.tsx](src/fields/Shell.tsx) draws `usa-form-group` with the label, hint and error message. [controls.tsx](src/fields/controls.tsx) renders the USWDS inputs, select, file input, checkboxes and radios.
- [src/fields/ComboBox.tsx](src/fields/ComboBox.tsx) is the USWDS combo box in React, used for `autocomplete` and the time picker.
- [src/fields/DateFields.tsx](src/fields/DateFields.tsx) handles `date` and `datetime` with the memorable date pattern. [MatrixRow.tsx](src/fields/MatrixRow.tsx) renders a matrix row with the same radios as radio fields.
- [src/definition.json](src/definition.json) is a three-step form with every field type.

| Formhaus type | USWDS component |
|---|---|
| `text`, `email`, `phone`, `number`, `password` | Text input, with Show password for `password` |
| `textarea` | Textarea |
| `select` | Select |
| `multiselect` | Checkbox list |
| `autocomplete` | Combo box |
| `radio` | Radio buttons, tiles when options have images |
| `checkbox`, `switch` | Checkbox |
| `date` | Memorable date |
| `datetime` | Memorable date and time picker |
| `time` | Time picker |
| `file` | File input |
| `scale`, `rating` | Radio buttons in a row |

USWDS has no switch, rating or scale component, so those use checkboxes and radio buttons.

## Use as a starter

Copy the folder, then change `definition.json`.

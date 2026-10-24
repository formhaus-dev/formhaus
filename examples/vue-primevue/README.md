# Vue + PrimeVue example

This example renders Formhaus forms with [PrimeVue 4](https://primevue.org) and its Aura theme. Every field type and every layout slot uses a PrimeVue component, so the page loads no Formhaus CSS.

## Run

This example is its own pnpm workspace and installs `@formhaus/*` from npm:

```bash
pnpm install
pnpm dev
```

Opens at http://localhost:5173. The page follows the system color scheme.

## Files

- [src/App.vue](src/App.vue) renders `HeadlessFormRenderer` inside a PrimeVue `Card`.
- [src/component-map.ts](src/component-map.ts) maps each Formhaus field type to a PrimeVue component with `mapControls`.
- [src/layout/index.ts](src/layout/index.ts) maps the layout slots: `Stepper` for progress, `Message` for the error summary, `Fieldset` and `Panel` for sections and groups, `Dialog` for the remove dialog, `Button` for actions.
- [src/fields/FieldShell.vue](src/fields/FieldShell.vue) draws the label, helper text and error around each control.
- [src/fields/AutocompleteControl.vue](src/fields/AutocompleteControl.vue) filters the `AutoComplete` suggestions.
- [src/fields/FileField.vue](src/fields/FileField.vue) and [src/fields/MatrixRow.vue](src/fields/MatrixRow.vue) are the file picker and the matrix rows.
- [src/definition.json](src/definition.json) is a three-step form with every field type.

| Formhaus type | PrimeVue component |
|---|---|
| `text`, `email`, `phone` | `InputText` |
| `password` | `Password` with `toggleMask` |
| `number` | `InputNumber` |
| `textarea` | `Textarea` |
| `select` | `Select` |
| `multiselect` | `MultiSelect` |
| `autocomplete` | `AutoComplete` |
| `radio` | `RadioButtonGroup` with `RadioButton` |
| `checkbox` | `Checkbox` |
| `switch` | `ToggleSwitch` |
| `date`, `datetime`, `time` | `DatePicker` |
| `file` | `FileUpload` in basic mode |
| `scale` | `RadioButtonGroup` styled as a button bar |
| `rating` | `Rating` |

## Use as a starter

Copy the folder, then change `definition.json`. PrimeVue 5 uses a commercial license, so this example stays on PrimeVue 4, which is MIT.

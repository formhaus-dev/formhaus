# Vue + Element Plus example

This example renders Formhaus forms with [Element Plus](https://element-plus.org). Every field type and every layout slot uses an Element Plus component, so the page loads no Formhaus CSS.

## Run

This example is its own pnpm workspace and installs `@formhaus/*` from npm:

```bash
pnpm install
pnpm dev
```

Opens at http://localhost:5173. The page follows the system color scheme with the Element Plus dark CSS variables.

## Files

- [src/App.vue](src/App.vue) renders `HeadlessFormRenderer` inside an `ElCard`.
- [src/component-map.ts](src/component-map.ts) maps each Formhaus field type to an Element Plus component with `mapControls`.
- [src/layout/index.ts](src/layout/index.ts) maps the layout slots: `ElSteps` for progress, `ElAlert` for the error summary, `ElCard` for sections and groups, `ElDialog` for the remove dialog, `ElButton` for actions.
- [src/fields/FieldShell.vue](src/fields/FieldShell.vue) wraps each control in `ElFormItem` with its `error` prop and adds the label and helper text.
- [src/fields/MatrixRow.vue](src/fields/MatrixRow.vue) renders a matrix row around the same `ElRadioGroup` control as radio fields.
- [src/definition.json](src/definition.json) is a three-step form with every field type.

| Formhaus type | Element Plus component |
|---|---|
| `text`, `email`, `phone`, `password`, `textarea` | `ElInput` |
| `number` | `ElInputNumber` |
| `select`, `multiselect` | `ElSelect` |
| `autocomplete` | `ElAutocomplete` |
| `radio` | `ElRadioGroup` with `ElRadio` |
| `checkbox` | `ElCheckbox` |
| `switch` | `ElSwitch` |
| `date`, `datetime` | `ElDatePicker` |
| `time` | `ElTimePicker` |
| `file` | `ElUpload` without auto upload |
| `scale` | `ElRadioGroup` with `ElRadioButton` |
| `rating` | `ElRate` |

## Use as a starter

Copy the folder, then change `definition.json`.

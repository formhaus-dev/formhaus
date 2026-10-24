# React + Chakra UI example

This example maps every Formhaus field type to [Chakra UI](https://chakra-ui.com) v3 components with `mapControls`, and renders steps, errors, sections, groups and the remove dialog with Chakra through the `layout` prop.

## Run

This example is its own pnpm workspace and installs `@formhaus/*` from npm:

```bash
pnpm install
pnpm dev
```

Opens at http://localhost:5173. The color mode follows the system setting, see [src/color-mode.ts](src/color-mode.ts).

## Files

- [src/App.tsx](src/App.tsx) wraps the form in `ChakraProvider` and shows the submitted values.
- [src/component-map.tsx](src/component-map.tsx) maps the field types to Chakra controls with `mapControls`, one entry per type. Text, email, phone, password, date, time and datetime use `Input` with the native input type, `number` uses `NumberInput`, `checkbox` and `switch` use `Checkbox` and `Switch`, `scale` uses `SegmentGroup`, `rating` uses `RatingGroup` and `file` uses `FileUpload`.
- [src/fields/Shell.tsx](src/fields/Shell.tsx) renders the label, helper text and error around each control: `Field` for single controls and `Fieldset` for option groups.
- [src/fields/select.tsx](src/fields/select.tsx) builds `Select` for `select` and `multiselect`, and [Autocomplete.tsx](src/fields/Autocomplete.tsx) uses `Combobox` with free text.
- [src/fields/Choices.tsx](src/fields/Choices.tsx) renders `RadioGroup`, or `RadioCard` tiles for options with images. [MatrixRow.tsx](src/fields/MatrixRow.tsx) is a table row inside a matrix section.
- [src/layout](src/layout) holds the `layout` slots: `Steps` progress, `Button` actions, `Alert` error summary, `Fieldset` sections with a `Table` for matrix sections, `Card` group items and a `Dialog` remove dialog.
- [src/definition.json](src/definition.json) is a three-step account form.

## Use as a starter

Copy the folder, then change `definition.json`. `src/playground.ts` only connects the app to the docs playground. Delete it together with the `listenToPlayground` call in `src/main.tsx`.

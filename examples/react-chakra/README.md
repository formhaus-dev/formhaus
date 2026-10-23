# React + Chakra UI example

This example maps every Formhaus field type to [Chakra UI](https://chakra-ui.com) v3 components through the `components` prop, and renders steps, errors, sections, groups and the remove dialog with Chakra through the `layout` prop.

## Run

This example is its own pnpm workspace and installs `@formhaus/*` from npm:

```bash
pnpm install
pnpm dev
```

Opens at http://localhost:5173. The color mode follows the system setting, see [src/color-mode.ts](src/color-mode.ts).

## Files

- [src/App.tsx](src/App.tsx) wraps the form in `ChakraProvider` and shows the submitted values.
- [src/component-map.ts](src/component-map.ts) maps each Formhaus field type to a Chakra renderer.
- [src/fields/shared.tsx](src/fields/shared.tsx) wraps single controls in `Field` and option groups in `Fieldset`, with label, helper text and error.
- [src/fields/SelectField.tsx](src/fields/SelectField.tsx) renders `select` and `multiselect` with `Select`, and [AutocompleteField.tsx](src/fields/AutocompleteField.tsx) uses `Combobox` with free text.
- [src/fields/DateField.tsx](src/fields/DateField.tsx) uses `DatePicker` and [DateTimeField.tsx](src/fields/DateTimeField.tsx) uses `DateInput`, both converted to the Formhaus `YYYY-MM-DD` and `YYYY-MM-DDTHH:mm` formats. `time` uses `Input` with `type="time"`.
- [src/fields/RadioField.tsx](src/fields/RadioField.tsx) renders `RadioGroup`, `RadioCard` for options with images, and a table row inside a matrix section.
- [src/fields/ScaleField.tsx](src/fields/ScaleField.tsx) and [RatingField.tsx](src/fields/RatingField.tsx) use `SegmentGroup` and `RatingGroup`.
- [src/layout](src/layout) holds the `layout` slots: `Steps` progress, `Button` actions, `Alert` error summary, `Fieldset` sections with a `Table` for matrix sections, `Card` group items and a `Dialog` remove dialog.
- [src/definition.json](src/definition.json) is a three-step account form.

## Use as a starter

Copy the folder, then change `definition.json`. `src/playground.ts` only connects the app to the docs playground. Delete it together with the `listenToPlayground` call in `src/main.tsx`.

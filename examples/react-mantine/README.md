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
- [src/component-map.ts](src/component-map.ts) maps each Formhaus field type to a Mantine renderer.
- [src/fields/TextField.tsx](src/fields/TextField.tsx) renders text, email, phone and password fields with `TextInput` and `PasswordInput`.
- [src/fields/DateField.tsx](src/fields/DateField.tsx), [DateTimeField.tsx](src/fields/DateTimeField.tsx) and [TimeField.tsx](src/fields/TimeField.tsx) use `@mantine/dates` and convert to the Formhaus `YYYY-MM-DD`, `YYYY-MM-DDTHH:mm` and `HH:mm` formats.
- [src/fields/RadioField.tsx](src/fields/RadioField.tsx) renders `Radio.Group`, `Radio.Card` for options with images, and a table row inside a matrix section.
- [src/fields/ScaleField.tsx](src/fields/ScaleField.tsx) and [RatingField.tsx](src/fields/RatingField.tsx) use `SegmentedControl` and `Rating`.
- [src/layout](src/layout) holds the `layout` slots: `Stepper` progress, `Button` actions, `Alert` error summary, `Fieldset` sections with a `Table` for matrix sections, `Card` group items and a `Modal` remove dialog.
- [src/definition.json](src/definition.json) is a three-step account form.

## Use as a starter

Copy the folder, then change `definition.json`. `src/playground.ts` only connects the app to the docs playground. Delete it together with the `listenToPlayground` call in `src/main.tsx`.

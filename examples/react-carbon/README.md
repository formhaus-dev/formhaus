# React + Carbon example

This example maps every Formhaus field type to [IBM Carbon](https://carbondesignsystem.com) (`@carbon/react`) components through the `components` prop, and renders steps, errors, sections, groups and the remove dialog with Carbon through the `layout` prop.

## Run

This example is its own pnpm workspace and installs `@formhaus/*` from npm:

```bash
pnpm install
pnpm dev
```

Opens at http://localhost:5173. The theme follows the system setting: `g10` in light mode, `g100` in dark mode.

## Files

- [src/App.tsx](src/App.tsx) wraps the form in Carbon `Theme` and shows the submitted values.
- [src/styles.scss](src/styles.scss) compiles only the Carbon component styles the example uses. IBM Plex comes from Google Fonts in [index.html](index.html).
- [src/component-map.ts](src/component-map.ts) maps each Formhaus field type to a Carbon renderer.
- [src/fields/DateField.tsx](src/fields/DateField.tsx) uses `DatePicker` and converts to `YYYY-MM-DD`. [DateTimeField.tsx](src/fields/DateTimeField.tsx) pairs `DatePicker` with `TimePicker` for `YYYY-MM-DDTHH:mm`, and [TimeField.tsx](src/fields/TimeField.tsx) uses `TimePicker` in 24-hour `HH:mm`.
- [src/fields/MultiselectField.tsx](src/fields/MultiselectField.tsx) uses `FilterableMultiSelect`, and [AutocompleteField.tsx](src/fields/AutocompleteField.tsx) uses `ComboBox` with free text.
- [src/fields/RadioField.tsx](src/fields/RadioField.tsx) renders `RadioButtonGroup`, `RadioTile` for options with images, and a table row inside a matrix section.
- [src/fields/ScaleField.tsx](src/fields/ScaleField.tsx) uses a horizontal `RadioButtonGroup`. Carbon has no rating control, so [RatingField.tsx](src/fields/RatingField.tsx) builds one from `IconButton` and the `Star` icons.
- [src/layout](src/layout) holds the `layout` slots: `ProgressIndicator` steps (`ProgressBar` on narrow screens), `ButtonSet` actions, `ActionableNotification` error summary, `Tile` sections with a `Table` for matrix sections, `Tile` group items and a danger `Modal` remove dialog.
- [src/definition.json](src/definition.json) is a three-step account form.

## Use as a starter

Copy the folder, then change `definition.json`. `src/playground.ts` only connects the app to the docs playground. Delete it together with the `listenToPlayground` call in `src/main.tsx`.

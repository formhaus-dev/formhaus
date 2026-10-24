# React + Carbon example

This example maps every Formhaus field type to [IBM Carbon](https://carbondesignsystem.com) (`@carbon/react`) components with `mapControls`, and renders steps, errors, sections, groups and the remove dialog with Carbon through the `layout` prop.

## Run

This example is its own pnpm workspace and installs `@formhaus/*` from npm:

```bash
pnpm install
pnpm dev
```

Opens at http://localhost:5173. The theme follows the system setting: `g10` in light mode, `g100` in dark mode.

## Files

- [src/App.tsx](src/App.tsx) wraps the form in Carbon `Theme` and shows the submitted values.
- [src/styles.scss](src/styles.scss) compiles only the Carbon component styles the example uses. IBM Plex Sans and Mono are self-hosted from the `@ibm/plex-sans` and `@ibm/plex-mono` packages, Latin subsets only.
- [src/component-map.tsx](src/component-map.tsx) maps the field types to Carbon controls with `mapControls`, one entry per type: `TextInput`, `PasswordInput`, `NumberInput`, `TextArea`, `Select`, `ComboBox` with free text, `FilterableMultiSelect`, `TimePicker` in 24-hour `HH:mm`, `Checkbox` and `Toggle`. Carbon controls render their own label, helper text and error, and [labels.ts](src/fields/labels.ts) passes them.
- [src/fields/DateInput.tsx](src/fields/DateInput.tsx) wraps `DatePicker` and converts to `YYYY-MM-DD`. [DateTimeField.tsx](src/fields/DateTimeField.tsx) pairs it with `TimePicker` for `YYYY-MM-DDTHH:mm`.
- [src/fields/Choices.tsx](src/fields/Choices.tsx) renders `radio` and `scale` with `RadioButtonGroup`, and `RadioTile` for options with images. [MatrixRow.tsx](src/fields/MatrixRow.tsx) is a table row inside a matrix section.
- Carbon has no rating control, so [Rating.tsx](src/fields/Rating.tsx) builds one from `IconButton` and the `Star` icons. [FileField.tsx](src/fields/FileField.tsx) pairs a `Button` with `FileUploaderItem`.
- [src/layout](src/layout) holds the `layout` slots: `ProgressIndicator` steps (`ProgressBar` on narrow screens), `ButtonSet` actions, `ActionableNotification` error summary, `Tile` sections with a `Table` for matrix sections, `Tile` group items and a danger `Modal` remove dialog.
- [src/definition.json](src/definition.json) is a three-step account form.

## Use as a starter

Copy the folder, then change `definition.json`. `src/playground.ts` only connects the app to the docs playground. Delete it together with the `listenToPlayground` call in `src/main.tsx`.

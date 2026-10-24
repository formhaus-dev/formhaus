# Vue + Vuetify example

This example renders Formhaus forms with [Vuetify 3](https://vuetifyjs.com) components through the `components` prop.

## Run

This example is its own pnpm workspace and installs `@formhaus/*` from npm:

```bash
pnpm install
pnpm dev
```

Opens at http://localhost:5173.

## Files

- [src/component-map.ts](src/component-map.ts) maps each Formhaus field type to a Vuetify component with `mapControls`. Simple types are one line each, and Vuetify draws their label, hint and error.
- [src/fields/GroupShell.vue](src/fields/GroupShell.vue) wraps radio, scale and rating groups in a `fieldset` with a legend, the scale anchors, the helper text and the error.
- [src/fields/OptionTiles.vue](src/fields/OptionTiles.vue) renders radio options with images as `v-card` tiles.
- [src/fields/MatrixRow.vue](src/fields/MatrixRow.vue) renders a matrix row around the same `v-radio-group` control as radio fields.
- [src/actions/](src/actions/) holds the layout slots: progress, error summary, sections, groups, the remove dialog and the actions.
- [src/definition.json](src/definition.json) is the contact form used by the example.

## Use as a starter

Copy the folder, then change `definition.json` and the field map. The example resolves its Formhaus dependencies from npm.

---
title: "Material UI integration"
description: "Render Formhaus JSON forms with Material UI: map TextField, Select, Autocomplete, Checkbox and other MUI inputs to field types through the components prop."
---

# Material UI

Map Material UI inputs to Formhaus field types with `mapControls` and pass the map to the `components` prop of `FormRenderer`.

[Open in StackBlitz](https://stackblitz.com/github/formhaus-dev/formhaus/tree/main/examples/react-mui) · [Source](https://github.com/formhaus-dev/formhaus/tree/main/examples/react-mui)

## Install

```bash
npm install @formhaus/core @formhaus/react @mui/material @emotion/react @emotion/styled
```

## Component map

[`mapControls`](/guide/design-systems) maps one MUI control per field type. MUI `TextField` renders its own label, helper and error, so text inputs have no shell:

<<< @/../examples/react-mui/src/component-map.tsx

## Shells

Checkbox, switch and the choice groups get a `FormControl` shell:

<<< @/../examples/react-mui/src/fields/shells.tsx

## Custom fields

MUI `Autocomplete` needs `renderInput`, so it stays a field written with [field helpers](/guide/custom-fields#field-helpers):

<<< @/../examples/react-mui/src/fields/AutocompleteField.tsx

## App

<<< @/../examples/react-mui/src/App.tsx

The option tiles, the file picker and the matrix row are in [`src/fields`](https://github.com/formhaus-dev/formhaus/tree/main/examples/react-mui/src/fields), the layout slots in [`src/actions`](https://github.com/formhaus-dev/formhaus/tree/main/examples/react-mui/src/actions).

## Server validation

The example validates in the browser only. On the server, run `validateSubmission()` from `@formhaus/core/server` on the posted values and pass the returned errors to the `errors` prop. See [Server-side validation](/guide/server-validation) and [Next.js](/guide/integrations/nextjs) for a complete route handler.

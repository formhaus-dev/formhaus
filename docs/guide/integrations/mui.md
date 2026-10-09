---
title: "Material UI integration"
description: "Render Formhaus JSON forms with Material UI: map TextField, Select, Autocomplete, Checkbox and other MUI inputs to field types through the components prop."
---

# Material UI

Map Material UI inputs to Formhaus field types through the `components` prop of `FormRenderer`.

[Open in StackBlitz](https://stackblitz.com/github/ignsm/formhaus/tree/main/examples/react-mui) · [Source](https://github.com/ignsm/formhaus/tree/main/examples/react-mui)

## Install

```bash
npm install @formhaus/core @formhaus/react @mui/material @emotion/react @emotion/styled
```

## Component map

<<< @/../examples/react-mui/src/component-map.ts

## Text field

One renderer covers text, email, phone, number, password, date and datetime fields:

<<< @/../examples/react-mui/src/fields/TextField.tsx

## App

<<< @/../examples/react-mui/src/App.tsx

The other renderers are in [`src/fields`](https://github.com/ignsm/formhaus/tree/main/examples/react-mui/src/fields) and [`src/actions`](https://github.com/ignsm/formhaus/tree/main/examples/react-mui/src/actions).

## Server re-validation

The example validates in the browser only. To check the same rules on the server, build a `FormEngine` from the same definition and call `validate()`, then pass the returned errors to the `errors` prop. See [Next.js](/guide/integrations/nextjs#how-server-re-validation-works) for a complete route handler.

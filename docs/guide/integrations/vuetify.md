---
title: "Vuetify integration"
description: "Render Formhaus JSON forms with Vuetify 3: map v-text-field, v-select, v-autocomplete and other Vuetify inputs to field types through the components prop."
---

# Vuetify

Map Vuetify inputs to Formhaus field types through the `components` prop of `FormRenderer` from `@formhaus/vue`.

[Open in StackBlitz](https://stackblitz.com/github/formhaus-dev/formhaus/tree/main/examples/vue-vuetify) · [Source](https://github.com/formhaus-dev/formhaus/tree/main/examples/vue-vuetify)

## Install

```bash
npm install @formhaus/core @formhaus/vue vuetify
```

## Component map

[`mapControls`](/guide/design-systems) maps one Vuetify control per field type. Vuetify inputs render their own label and messages, so only the choice groups have a shell:

<<< @/../examples/vue-vuetify/src/component-map.ts

## Group shell

<<< @/../examples/vue-vuetify/src/fields/GroupShell.vue

## App

<<< @/../examples/vue-vuetify/src/App.vue

The option tiles and the matrix row are in [`src/fields`](https://github.com/formhaus-dev/formhaus/tree/main/examples/vue-vuetify/src/fields), the layout slots in [`src/actions`](https://github.com/formhaus-dev/formhaus/tree/main/examples/vue-vuetify/src/actions).

## Server validation

The example validates in the browser only. On the server, run `validateSubmission()` from `@formhaus/core/server` on the posted values and pass the returned errors to the `errors` prop. See [Server-side validation](/guide/server-validation) and [Nuxt](/guide/integrations/nuxt) for a complete server route.

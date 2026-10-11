---
title: "Vuetify integration"
description: "Render Formhaus JSON forms with Vuetify 3: map v-text-field, v-select, v-autocomplete and other Vuetify inputs to field types through the components prop."
---

# Vuetify

Map Vuetify inputs to Formhaus field types through the `components` prop of `FormRenderer` from `@formhaus/vue`.

[Open in StackBlitz](https://stackblitz.com/github/ignsm/formhaus/tree/main/examples/vue-vuetify) · [Source](https://github.com/ignsm/formhaus/tree/main/examples/vue-vuetify)

## Install

```bash
npm install @formhaus/core @formhaus/vue vuetify
```

## Component map

<<< @/../examples/vue-vuetify/src/component-map.ts

## Text field

<<< @/../examples/vue-vuetify/src/fields/TextField.vue

## App

<<< @/../examples/vue-vuetify/src/App.vue

The other renderers are in [`src/fields`](https://github.com/ignsm/formhaus/tree/main/examples/vue-vuetify/src/fields) and [`src/actions`](https://github.com/ignsm/formhaus/tree/main/examples/vue-vuetify/src/actions).

## Server validation

The example validates in the browser only. On the server, run `validateSubmission()` from `@formhaus/core/server` on the posted values and pass the returned errors to the `errors` prop. See [Server-side validation](/guide/server-validation) and [Nuxt](/guide/integrations/nuxt) for a complete server route.

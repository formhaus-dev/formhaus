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

## Server re-validation

The example validates in the browser only. To check the same rules on the server, build a `FormEngine` from the same definition and call `validate()`, then pass the returned errors to the `errors` prop. See [Nuxt](/guide/integrations/nuxt#how-server-re-validation-works) for a complete server route.

# @formhaus/vue

Renders a JSON form definition in Vue 3: multi-step, conditional and branching forms on top of [`@formhaus/core`](https://www.npmjs.com/package/@formhaus/core). Native HTML inputs by default. Part of [Formhaus](https://github.com/ignsm/formhaus).

## Install

```bash
npm install @formhaus/core @formhaus/vue
```

Requires Vue 3.3 or later and Node 20 or later.

## Usage

```vue
<script setup lang="ts">
import { FormRenderer } from '@formhaus/vue';
import definition from './contact-form.json';

async function handleSubmit(values: Record<string, unknown>) {
  await fetch('/api/contact', {
    method: 'POST',
    body: JSON.stringify(values),
  });
}
</script>

<template>
  <FormRenderer :definition="definition" @submit="handleSubmit" />
</template>
```

## Features

- Built-in field types, sections, repeatable groups and conditional visibility. See [fields](https://formhaus.dev/guide/fields).
- [Multi-step forms](https://formhaus.dev/guide/steps) with lifecycle hooks, radio `autoAdvance`, async step validation and [branching routes](https://formhaus.dev/guide/steps#route-between-branches).
- [Custom components](https://formhaus.dev/guide/custom-components) through the `components` prop, plus `HeadlessFormRenderer` to keep the built-in fields out of your bundle. Integrations: [Vuetify, Element Plus](https://formhaus.dev/guide/integrations/vuetify).
- Dynamic select options with `optionsFrom` and `optionsProviders`. See [fields](https://formhaus.dev/guide/fields).
- [Form events](https://formhaus.dev/guide/custom-components#form-events) through `@formEvent`, for analytics.
- [Translations](https://formhaus.dev/guide/translations): `useLocalizedForm()` from `@formhaus/vue/i18n`.
- [Server-side validation](https://formhaus.dev/guide/server-validation) of the same definition with `@formhaus/core/server`.
- [Formhaus Cloud](https://formhaus.dev/guide/endpoint): `FormhausForm` from `@formhaus/vue/cloud` renders a published form and submits to the hosted endpoint, with file uploads and the bot check.
- [Theming](https://formhaus.dev/guide/#optional-baseline-styles): `import '@formhaus/core/style.css'`, then override the `--fh-*` custom properties.
- [Nuxt](https://formhaus.dev/guide/integrations/nuxt) support.

### Formhaus Cloud

```vue
<script setup lang="ts">
import { FormhausForm } from '@formhaus/vue/cloud';
</script>

<template>
  <FormhausForm id="form_id" />
</template>
```

## Docs

- [Guide](https://formhaus.dev/guide/), [API reference](https://formhaus.dev/api/form-engine) and [recipes](https://formhaus.dev/recipes/)
- [Framework overview](https://formhaus.dev/framework) and [playground](https://formhaus.dev/playground)
- [Source and issues](https://github.com/ignsm/formhaus)

## License

MIT

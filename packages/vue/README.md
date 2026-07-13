# @formhaus/vue

Vue 3 adapter for [Formhaus](https://github.com/ignsm/formhaus). Renders forms from a JSON definition with native HTML inputs by default. Drop in your own components via a `components` prop.

## Install

```bash
npm install @formhaus/core @formhaus/vue
```

Requires Vue ≥3.3 and Node ≥18.

## Generating a definition

Write the form JSON by hand, or use the [`/formhaus-create-form`](https://formhaus.dev/guide/formhaus-create-form.html) Claude Code skill to generate it from a text description, a CSV table, or a screenshot of an existing form.

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

## Custom components

Swap native HTML for your own UI kit:

```vue
<!-- MyInput.vue -->
<script setup lang="ts">
import type { FormFieldProps } from '@formhaus/vue';

defineProps<FormFieldProps>();
defineEmits<{ (e: 'update:value', value: unknown): void }>();
</script>

<template>
  <div>
    <label>{{ field.label }}</label>
    <input
      :value="value"
      @input="$emit('update:value', ($event.target as HTMLInputElement).value)"
    />
    <span v-if="error">{{ error }}</span>
  </div>
</template>
```

```vue
<FormRenderer
  :definition="definition"
  :components="{ text: MyInput, email: MyInput }"
  @submit="handleSubmit"
/>
```

Unmapped field types fall back to native HTML.

## Dynamic options

Use `optionsFrom` to load select-like options and `optionsDependsOn` to rerun the provider when another field changes:

```vue
<script setup lang="ts">
import { FormRenderer, type OptionsProvider } from '@formhaus/vue';

const loadCities: OptionsProvider = async (values) => {
  const response = await fetch(`/api/cities?country=${values.country ?? ''}`);
  return response.json();
};
</script>

<template>
  <FormRenderer
    :definition="definition"
    :options-providers="{ cities: loadCities }"
    @submit="handleSubmit"
  />
</template>
```

```json
{
  "key": "city",
  "type": "select",
  "label": "City",
  "optionsFrom": "cities",
  "optionsDependsOn": ["country"]
}
```

The provider receives all current values. If requests overlap, only the latest result is used.

## Optional baseline styles

By default the Vue adapter renders unstyled HTML. For a sensible starting look (padding, focus states, error colour, button styles) import the shared stylesheet from `@formhaus/core`:

```ts
// main.ts
import '@formhaus/core/style.css';
```

Theme via CSS custom properties (`--fh-color-primary`, `--fh-radius`, `--fh-gap`, etc.). If you bring your own components via the `components` prop (Vuetify, Element Plus, Naive UI), the stylesheet doesn't apply to those.

## Docs

- Full guide and API reference: https://formhaus.dev
- Live playground: https://formhaus.dev/playground.html
- Source and issues: https://github.com/ignsm/formhaus

## License

MIT

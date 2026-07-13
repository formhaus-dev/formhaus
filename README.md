# Formhaus

[![npm](https://img.shields.io/npm/v/@formhaus/core?label=core)](https://www.npmjs.com/package/@formhaus/core)
[![npm](https://img.shields.io/npm/v/@formhaus/react?label=react)](https://www.npmjs.com/package/@formhaus/react)
[![npm](https://img.shields.io/npm/v/@formhaus/vue?label=vue)](https://www.npmjs.com/package/@formhaus/vue)
[![bundlephobia](https://img.shields.io/bundlephobia/minzip/@formhaus/core?label=core%20size)](https://bundlephobia.com/package/@formhaus/core)
[![license](https://img.shields.io/github/license/ignsm/formhaus)](LICENSE)

Formhaus keeps fields, validation, visibility, and steps in a compact JSON definition. `@formhaus/core` runs it without a UI framework. React and Vue adapters render native or custom controls, and the Figma plugin reads the same definition.

## Packages

| Package | Description | npm |
|---------|-------------|-----|
| `@formhaus/core` | Zero-dependency form engine: types, validation, visibility, multi-step | `npm i @formhaus/core` |
| `@formhaus/react` | React adapter with native HTML defaults and custom component support | `npm i @formhaus/react` |
| `@formhaus/vue` | Vue 3 adapter with native HTML defaults and custom component support | `npm i @formhaus/vue` |

`@formhaus/figma` generates form mockups on the Figma canvas. It is not on Figma Community yet; build it locally, then import `packages/figma/manifest.json`.

Svelte, Solid, or anything else: use `@formhaus/core` directly. The [playground](https://formhaus.dev/playground.html) has a Svelte example.

## Install

```bash
npm install @formhaus/core
```

If you need a framework adapter:

```bash
npm install @formhaus/react   # React
npm install @formhaus/vue     # Vue
```

Or use `@formhaus/core` directly with any framework. See the [Svelte example](https://formhaus.dev/playground.html).

## Quick start

### Define a form

Write the JSON by hand, or use the [`/formhaus-create-form`](https://formhaus.dev/guide/formhaus-create-form.html) Claude Code skill to generate it from a text description, a CSV table, or a screenshot of an existing form.

```json
{
  "id": "contact",
  "title": "Contact Us",
  "submit": { "label": "Send" },
  "fields": [
    {
      "key": "name",
      "type": "text",
      "label": "Name",
      "placeholder": "Your name",
      "validation": { "required": true, "minLength": 2 }
    },
    {
      "key": "email",
      "type": "email",
      "label": "Email",
      "placeholder": "you@example.com",
      "validation": {
        "required": true,
        "pattern": "^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$",
        "patternMessage": "Please enter a valid email address"
      }
    },
    {
      "key": "message",
      "type": "textarea",
      "label": "Message",
      "placeholder": "How can we help?",
      "rows": 4,
      "validation": { "required": true }
    }
  ]
}
```

### React

```bash
npm install @formhaus/core @formhaus/react
```

```tsx
import { FormRenderer } from '@formhaus/react';
import definition from './contact-form.json';

function ContactPage() {
  async function handleSubmit(values: Record<string, unknown>) {
    await fetch('/api/contact', {
      method: 'POST',
      body: JSON.stringify(values),
    });
  }

  return <FormRenderer definition={definition} onSubmit={handleSubmit} />;
}
```

### Vue

```bash
npm install @formhaus/core @formhaus/vue
```

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

By default, both adapters render native HTML inputs.

## Custom components

Both adapters accept a `components` prop (a `FieldComponentMap`) that lets you swap native HTML inputs for your own UI kit.

### React

```tsx
import type { FieldComponentMap, FieldComponentProps } from '@formhaus/react';

function MyTextInput({ field, value, error, onChange, onBlur }: FieldComponentProps) {
  return (
    <div>
      <label>{field.label}</label>
      <input
        type={field.type}
        value={(value as string) ?? ''}
        placeholder={field.placeholder}
        onChange={(e) => onChange(e.target.value)}
        onBlur={onBlur}
      />
      {error && <span className="error">{error}</span>}
    </div>
  );
}

const components: FieldComponentMap = {
  text: MyTextInput,
  email: MyTextInput,
};

<FormRenderer definition={definition} onSubmit={handleSubmit} components={components} />;
```

### Vue

```vue
<!-- MyTextInput.vue -->
<script setup lang="ts">
import type { FormFieldProps } from '@formhaus/vue';

const props = defineProps<FormFieldProps>();
const emit = defineEmits<{ (e: 'update:value', value: unknown): void }>();
</script>

<template>
  <label>{{ props.field.label }}</label>
  <input
    :value="(props.value as string) ?? ''"
    @input="emit('update:value', ($event.target as HTMLInputElement).value)"
  />
</template>
```

```vue
<!-- Usage -->
<script setup>
import { FormRenderer } from '@formhaus/vue';
import MyTextInput from './MyTextInput.vue';
</script>

<template>
  <FormRenderer
    :definition="definition"
    :components="{ text: MyTextInput, email: MyTextInput }"
    @submit="handleSubmit"
  />
</template>
```

Each field component receives the full `FormField` descriptor, the current value, and any validation error. Implement as many or as few field types as you need. Unmapped types fall back to native HTML.

## Figma plugin

`@formhaus/figma` maps form definitions to components from your Figma library. The [`/formhaus-figma-connect`](https://formhaus.dev/guide/formhaus-figma-connect.html) Claude Code skill can generate the `componentMap`. See the [plugin guide](https://formhaus.dev/guide/figma.html) for local installation.

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md).

## License

[MIT](LICENSE)

# Formhaus

[![npm](https://img.shields.io/npm/v/@formhaus/core?label=core)](https://www.npmjs.com/package/@formhaus/core)
[![npm](https://img.shields.io/npm/v/@formhaus/react?label=react)](https://www.npmjs.com/package/@formhaus/react)
[![npm](https://img.shields.io/npm/v/@formhaus/vue?label=vue)](https://www.npmjs.com/package/@formhaus/vue)
[![bundlephobia](https://img.shields.io/bundlephobia/minzip/@formhaus/core?label=core%20size)](https://bundlephobia.com/package/@formhaus/core)
[![license](https://img.shields.io/github/license/ignsm/formhaus)](LICENSE)

Framework-agnostic form engine with a compact JSON definition format.
Define a form once (fields, validation, conditions, steps) in a single file. Render it in React, Vue, Figma, or anything via the core engine. No JSON Schema spec, no separate UI schema, no boilerplate.

## Packages

| Package | Description | npm |
|---------|-------------|-----|
| `@formhaus/core` | Zero-dependency form engine: types, validation, visibility, multi-step | `npm i @formhaus/core` |
| `@formhaus/react` | React adapter with native HTML defaults and custom component support | `npm i @formhaus/react` |
| `@formhaus/vue` | Vue 3 adapter with native HTML defaults and custom component support | `npm i @formhaus/vue` |

`@formhaus/figma` generates form mockups on the Figma canvas from a form definition. Not on Figma Community yet, install as a local plugin via `packages/figma/manifest.json`.

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

## Quick Start

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

## Custom Components

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
        value={value as string}
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

defineProps<FormFieldProps>();
defineEmits<{ (e: 'update:modelValue', value: unknown): void }>();
</script>
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

## Figma Plugin

`@formhaus/figma` generates styled form mockups on the Figma canvas from a form definition. Map your design system components to field types via a `componentMap` that the [`/formhaus-figma-connect`](https://formhaus.dev/guide/formhaus-figma-connect.html) Claude Code skill can generate for you by scanning your Figma file. Not on Figma Community yet, install as a local plugin via `packages/figma/manifest.json`.

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md).

## License

[MIT](LICENSE)

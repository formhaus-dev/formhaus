# Formhaus

[![npm](https://img.shields.io/npm/v/@formhaus/core?label=core)](https://www.npmjs.com/package/@formhaus/core)
[![npm](https://img.shields.io/npm/v/@formhaus/react?label=react)](https://www.npmjs.com/package/@formhaus/react)
[![npm](https://img.shields.io/npm/v/@formhaus/vue?label=vue)](https://www.npmjs.com/package/@formhaus/vue)
[![bundlephobia](https://img.shields.io/bundlephobia/minzip/@formhaus/core?label=core%20size)](https://bundlephobia.com/package/@formhaus/core)
[![license](https://img.shields.io/github/license/ignsm/formhaus)](LICENSE)

Framework-agnostic form engine with its own compact JSON-based definition format.
Define a form once — fields, validation, conditions, steps — in a single file. Render it in React, Vue, Figma, or any framework via the core engine. No JSON Schema spec, no separate UI schema, no boilerplate.

## Packages

| Package | Description | npm |
|---------|-------------|-----|
| `@formhaus/core` | Zero-dependency form engine: types, validation, visibility, multi-step | `npm i @formhaus/core` |
| `@formhaus/react` | React adapter with native HTML defaults and custom component support | `npm i @formhaus/react` |
| `@formhaus/vue` | Vue 3 adapter with native HTML defaults and custom component support | `npm i @formhaus/vue` |

There is also a Figma plugin (`@formhaus/figma`) that generates form mockups from form definitions. Available via `manifest.json` for now.

Svelte, Solid, or anything else: use `@formhaus/core` directly. See the [playground](https://formhaus.dev/playground) for an example.

## Install

```bash
npm install @formhaus/core
```

If you need a framework adapter:

```bash
npm install @formhaus/react   # React
npm install @formhaus/vue     # Vue
```

Or use `@formhaus/core` directly with any framework. See the [Svelte example in the playground](/playground).

## Quick Start

### Define a form

You can write the JSON by hand or use the [Claude skill](.claude/skills/formhaus-create-form/SKILL.md) to generate it from a text description.

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
import schema from './contact-schema.json';

function ContactPage() {
  async function handleSubmit(values: Record<string, unknown>) {
    await fetch('/api/contact', {
      method: 'POST',
      body: JSON.stringify(values),
    });
  }

  return <FormRenderer schema={schema} onSubmit={handleSubmit} />;
}
```

### Vue

```bash
npm install @formhaus/core @formhaus/vue
```

```vue
<script setup lang="ts">
import { FormRenderer } from '@formhaus/vue';
import schema from './contact-schema.json';

async function handleSubmit(values: Record<string, unknown>) {
  await fetch('/api/contact', {
    method: 'POST',
    body: JSON.stringify(values),
  });
}
</script>

<template>
  <FormRenderer :schema="schema" @submit="handleSubmit" />
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

<FormRenderer schema={schema} onSubmit={handleSubmit} components={components} />;
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
    :schema="schema"
    :components="{ text: MyTextInput, email: MyTextInput }"
    @submit="handleSubmit"
  />
</template>
```

Each field component receives the full `FormField` descriptor, the current value, and any validation error. Implement as many or as few field types as you need. Unmapped types fall back to native HTML.

## Figma Plugin

`@formhaus/figma` is a Figma plugin that takes a formhaus form definition and generates a styled form mockup directly on the canvas. Useful for rapid prototyping and design handoff.

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md).

## License

[MIT](LICENSE)

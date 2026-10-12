---
description: "Install @formhaus/core with the React or Vue renderer, write a JSON form definition and render your first form with validation and steps."
---

# Getting started

Formhaus keeps fields, validation, visibility, and steps in a JSON definition. The core engine runs without a UI framework; React, Vue, Figma, and custom renderers use the same format.

## Install

::: code-group
```bash [React]
npm install @formhaus/core @formhaus/react
```

```bash [Vue]
npm install @formhaus/core @formhaus/vue
```

```bash [Other]
npm install @formhaus/core
```
:::

Install `@formhaus/core` next to the adapter: the stylesheet and the `FormDefinition` type come from it. With any other framework, use `@formhaus/core` directly. See the [Svelte example in the playground](/playground#svelte).

### Optional baseline styles

The default React and Vue components render unstyled HTML. For a finished look import the shared stylesheet:

```ts
import '@formhaus/core/style.css';
```

Theme via CSS custom properties (`--fh-color-primary`, `--fh-radius`, `--fh-gap`, etc.). The hover and selected-option colors are derived from `--fh-color-primary`.

The stylesheet is light by default. For dark colors add `data-fh-theme="dark"` to the form or any ancestor:

```html
<div data-fh-theme="dark">
  <!-- FormRenderer -->
</div>
```

When you bring your own components via the `components` prop, the stylesheet doesn't apply to them.

Action buttons use these classes:

| Class | Buttons |
|---|---|
| `fh-form-actions__button--primary` | Continue, Submit |
| `fh-form-actions__button--secondary` | Back |
| `fh-form-actions__button--text` | Skip, Cancel |

Every button also has `fh-form-actions__button`. A `variant` on the action replaces the role class.

## Quick start

Save the definition as `contact-form.json`:

```json
{
  "id": "contact",
  "title": "Contact Us",
  "submit": { "label": "Send" },
  "fields": [
    { "key": "name", "type": "text", "label": "Name", "validation": { "required": true } },
    { "key": "email", "type": "email", "label": "Email", "validation": { "required": true } }
  ]
}
```

TypeScript types JSON strings as `string`, so values such as `layout` or `variant` do not match `FormDefinition`. Cast the import:

::: code-group
```tsx [React]
import type { FormDefinition } from '@formhaus/core';
import { FormRenderer } from '@formhaus/react';
import '@formhaus/core/style.css';
import json from './contact-form.json';

const definition = json as FormDefinition;

export function ContactForm() {
  return (
    <FormRenderer
      definition={definition}
      onSubmit={(values) => console.log(values)}
    />
  );
}
```

```vue [Vue]
<script setup lang="ts">
import type { FormDefinition } from '@formhaus/core';
import { FormRenderer } from '@formhaus/vue';
import '@formhaus/core/style.css';
import json from './contact-form.json';

const definition = json as FormDefinition;

async function submit(values: Record<string, unknown>) {
  console.log(values);
}
</script>

<template>
  <FormRenderer :definition="definition" @submit="submit" />
</template>
```
:::

The renderer reads the form definition, renders fields, handles validation, and gives you values on submit.

## How it works

```
Form definition --> FormEngine (TypeScript) --> Adapter --> UI components
                     |
                     |-- values, errors, step state
                     |-- visibility (show/hide fields)
                     |-- validation (required, pattern, etc.)
                     +-- general, field, and structure subscriptions
```

4 published packages:

| Package | What it does | Dependencies |
|---------|-------------|--------------|
| `@formhaus/core` | Types, validation, visibility, FormEngine class | None (pure TS) |
| `@formhaus/vue` | Vue adapter with default HTML field components | @formhaus/core |
| `@formhaus/react` | React adapter with default HTML field components | @formhaus/core |
| `@formhaus/mcp` | MCP server that validates definitions and simulates step paths for AI agents | @formhaus/core, MCP SDK |

The engine is framework-agnostic. It holds form state, runs validation, tracks field visibility, and manages step navigation. Adapters connect the engine to framework-specific reactivity and render UI components.

## Packages

### @formhaus/core

Pure TypeScript, zero deps. Contains:
- Type definitions for the form definition format
- `FormEngine` class (state machine for the form)
- Visibility evaluation (`show`/`showAny` conditions)
- Validation (built-in rules + custom validators)
- Definition warnings for missing dependencies and field or step cycles

### @formhaus/vue

Vue 3.3+. Renders native HTML form elements by default. Override any field type with your own components via the `components` prop.

### @formhaus/react

React 18+. Renders native HTML by default and accepts replacements through `components`. It works with Next.js prerendering and React's `renderToString` without a `next/dynamic` wrapper.

### @formhaus/mcp

Node 20+. Runs over stdio in Claude Code, Claude Desktop, Cursor and other MCP clients. See [MCP Server](/guide/mcp).

## Next steps

- [Field Types](/guide/fields): all supported form field types
- [Validation](/guide/validation): add rules to your fields
- [Examples](/guide/examples): working form definitions to learn from

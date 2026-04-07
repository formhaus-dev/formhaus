# Getting Started

Framework-agnostic JSON-schema-driven form ecosystem.
Define a form once as a JSON schema, render it anywhere in code or Figma.

## Install

```bash
npm install @formhaus/core
```

If you need a framework adapter:

```bash
npm install @formhaus/react   # React
npm install @formhaus/vue     # Vue
```

Or use `@formhaus/core` directly with any framework. See the [Svelte example in the playground](/playground#svelte).

## Quick start

::: code-group
```vue [Vue]
<script setup>
import { FormRenderer } from '@formhaus/vue';
import schema from '@formhaus/core/fixtures/basic-form.json';

function onSubmit(values) {
  console.log(values);
}
</script>

<template>
  <FormRenderer :schema="schema" @submit="onSubmit" />
</template>
```

```tsx [React]
import { FormRenderer } from '@formhaus/react';
import schema from '@formhaus/core/fixtures/basic-form.json';

function MyForm() {
  return (
    <FormRenderer
      schema={schema}
      onSubmit={(values) => console.log(values)}
    />
  );
}
```
:::

The renderer reads the schema, renders fields, handles validation, and gives you values on submit.

## How it works

```
JSON Schema --> FormEngine (pure TS) --> Adapter --> UI Components
                     |
                     |-- values, errors, step state
                     |-- visibility (show/hide fields)
                     |-- validation (required, pattern, etc.)
                     +-- subscribe/getSnapshot (React)
                         computed refs (Vue)
```

3 packages:

| Package | What it does | Dependencies |
|---------|-------------|--------------|
| `@formhaus/core` | Types, validation, visibility, FormEngine class | None (pure TS) |
| `@formhaus/vue` | Vue adapter with default HTML field components | @formhaus/core |
| `@formhaus/react` | React adapter with default HTML field components | @formhaus/core |

The engine is framework-agnostic. It holds form state, runs validation, tracks field visibility, and manages step navigation. Adapters connect the engine to framework-specific reactivity and render UI components.

## Packages

### @formhaus/core

Pure TypeScript, zero deps. Contains:
- Type definitions for the JSON schema
- `FormEngine` class (state machine for the form)
- Visibility evaluation (`show`/`showAny` conditions)
- Validation (built-in rules + custom validators)
- Schema validation (DAG cycle detection for show conditions)

### @formhaus/vue

Vue 3.3+. Renders native HTML form elements by default. Override any field type with your own components via the `components` prop.

### @formhaus/react

React 18+. Same idea as the Vue adapter. Native HTML by default, override via `components` prop.

## Next steps

- [Field Types](/guide/fields): all supported form field types
- [Validation](/guide/validation): add rules to your fields
- [Examples](/guide/examples): working form schemas to learn from

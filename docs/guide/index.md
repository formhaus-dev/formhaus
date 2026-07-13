# Getting started

Formhaus keeps fields, validation, visibility, and steps in a JSON definition. The core engine runs without a UI framework; React, Vue, Figma, and custom renderers use the same format.

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

### Optional baseline styles

The default React and Vue components render unstyled HTML. For a starting look (padding, focus, error colour) import the shared stylesheet:

```ts
import '@formhaus/core/style.css';
```

Theme via CSS custom properties (`--fh-color-primary`, `--fh-radius`, `--fh-gap`, etc.). When you bring your own components via the `components` prop, the stylesheet doesn't apply to them.

## Quick start

```ts
const definition = {
  id: 'contact',
  title: 'Contact Us',
  submit: { label: 'Send' },
  fields: [
    { key: 'name', type: 'text', label: 'Name', validation: { required: true } },
    { key: 'email', type: 'email', label: 'Email', validation: { required: true } },
  ],
};
```

::: code-group
```vue [Vue]
<script setup>
import { FormRenderer } from '@formhaus/vue';
import definition from './contact-form.json';

function onSubmit(values) {
  console.log(values);
}
</script>

<template>
  <FormRenderer :definition="definition" @submit="onSubmit" />
</template>
```

```tsx [React]
import { FormRenderer } from '@formhaus/react';
import definition from './contact-form.json';

function MyForm() {
  return (
    <FormRenderer
      definition={definition}
      onSubmit={(values) => console.log(values)}
    />
  );
}
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

3 published packages:

| Package | What it does | Dependencies |
|---------|-------------|--------------|
| `@formhaus/core` | Types, validation, visibility, FormEngine class | None (pure TS) |
| `@formhaus/vue` | Vue adapter with default HTML field components | @formhaus/core |
| `@formhaus/react` | React adapter with default HTML field components | @formhaus/core |

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

## Next steps

- [Field Types](/guide/fields): all supported form field types
- [Validation](/guide/validation): add rules to your fields
- [Examples](/guide/examples): working form definitions to learn from

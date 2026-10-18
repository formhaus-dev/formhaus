---
description: "Install @formhaus/core with the React or Vue renderer, write a JSON form definition and render your first form with validation and steps."
---

# Getting started

Formhaus keeps fields, validation, visibility, and steps in a JSON definition. The core engine runs without a UI framework; React, Vue, Figma, and custom renderers use the same format.

This guide covers the open-source library: MIT, no account, and `onSubmit` sends the data to your own backend.

::: tip Hosted form without a backend
[Formhaus Cloud](/cloud/overview) is a separate, optional service. Run `claude mcp add --transport http formhaus https://api.formhaus.dev/mcp` and ask: "Make me a waitlist form and give me the link." See the [Cloud quickstart](/cloud/quickstart).
:::

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

Theme via CSS custom properties (`--fh-color-primary`, `--fh-radius`, `--fh-gap`, etc.). The hover and selected-option colors are derived from `--fh-color-primary`. With `FormhausForm`, set theme tokens on `.fh-cloud` to also style the notices, load errors and success message. Inside `FormhausForm`, `--fh-color-border-focus`, `--fh-input-padding`, `--fh-font-size-heading`, `--fh-font-size-title`, `--fh-card-padding`, `--fh-color-primary-hover`, `--fh-color-primary-soft` and `--fh-color-error-soft` have no value unless you set them. Custom CSS that reads one needs a fallback, for example `var(--fh-input-padding, 10px 14px)`.

Hover states apply only on devices with a mouse or trackpad, and transitions turn off under `prefers-reduced-motion`. These variables set the hover colors:

| Variable | Used for |
|---|---|
| `--fh-color-border-hover` | Input, option and secondary button borders |
| `--fh-color-control-hover` | Radio and checkbox borders |
| `--fh-color-bg-hover` | Option, secondary and text button backgrounds |
| `--fh-color-primary-hover` | Primary button background and checked switch track |

Spacing and sizes come from these variables:

| Variable | Default | Used for |
|---|---|---|
| `--fh-space-1` … `--fh-space-10` | 4, 6, 8, 10, 12, 14, 16, 18, 20, 24px | Every margin, padding and gap in the stylesheet |
| `--fh-gap` | 28px | Space between fields, also inside sections and group cards |
| `--fh-card-padding` | 24px (16px up to 480px wide) | Side and bottom padding of group item cards |
| `--fh-input-padding` | `--fh-space-4` `--fh-space-6` | Padding inside inputs |
| `--fh-control-height`, `--fh-radius` | 46px, 10px | Input and button height, corner radius |
| `--fh-font-size`, `--fh-font-size-small` | 15px, 13px (17px, 15px on touch screens) | Labels and inputs; helpers, errors and item titles |
| `--fh-font-size-heading`, `--fh-font-size-title` | font size + 2px, + 5px | Section headings; step titles |
| `--fh-color-error-soft`, `--fh-color-error-hover` | derived from `--fh-color-error` | Hover of the group item Remove button |

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

TypeScript types JSON strings as `string`, so values such as `layout` or `variant` do not match `FormDefinition`. `parseDefinition()` checks the JSON and returns it typed, or throws a `FormDefinitionError` that lists every problem:

::: code-group
```tsx [React]
import { parseDefinition } from '@formhaus/core';
import { FormRenderer } from '@formhaus/react';
import '@formhaus/core/style.css';
import json from './contact-form.json';

const definition = parseDefinition(json);

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
import { parseDefinition } from '@formhaus/core';
import { FormRenderer } from '@formhaus/vue';
import '@formhaus/core/style.css';
import json from './contact-form.json';

const definition = parseDefinition(json);

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

## Definition and initial values

`initialValues` is the starting value of the form, not a controlled value: changing it later does not change the form. A new `definition` object creates a new form and resets its values, even with the same content. Keep the definition in a module constant, `useMemo` or a Vue `computed`, and change `key` to reset the form on purpose:

::: code-group
```tsx [React]
const definition = parseDefinition(json);

function ProfileForm({ user, plans }) {
  const withPlans = useMemo(() => addPlanOptions(definition, plans), [plans]);
  return <FormRenderer key={user.id} definition={withPlans} initialValues={user} onSubmit={save} />;
}
```

```vue [Vue]
<script setup lang="ts">
const definition = parseDefinition(json);
const props = defineProps<{ user: User; plans: Plan[] }>();
const withPlans = computed(() => addPlanOptions(definition, props.plans));
</script>

<template>
  <FormRenderer :key="user.id" :definition="withPlans" :initial-values="user" @submit="save" />
</template>
```
:::

In development, the renderer warns when it gets a new definition object with the same content as the previous one.

To change a value after the form mounts, put a ref on the renderer. `FormRenderer` and `HeadlessFormRenderer` expose `setValue(key, value)` and `getValues()`, typed as `FormRendererHandle`. `setValue` does not call `onFieldChange` (React) or emit `fieldChange` (Vue).

`onValuesChange` (React) and `valuesChange` (Vue) fire on mount and on every value-changing operation, with a frozen copy of the values. In Vue, the handle also has a reactive `values`. See [Derived values](/recipes/derived-values).

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

Vue 3.3.3+. Renders native HTML form elements by default. Override any field type with your own components via the `components` prop.

### @formhaus/react

React 18 and 19. Renders native HTML by default and accepts replacements through `components`. It works with Next.js prerendering and React's `renderToString` without a `next/dynamic` wrapper.

### @formhaus/mcp

Node 20+. Runs over stdio in Claude Code, Claude Desktop, Cursor and other MCP clients. See [MCP Server](/guide/mcp).

## Next steps

- [Field Types](/guide/fields): all supported form field types
- [Validation](/guide/validation): add rules to your fields
- [Examples](/guide/examples): working form definitions to learn from

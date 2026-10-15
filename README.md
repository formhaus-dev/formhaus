<p align="center">
  <img src=".github/assets/logo.svg" alt="Formhaus" width="360">
</p>

<p align="center">
  <a href="https://github.com/ignsm/formhaus/actions/workflows/ci.yml"><img src="https://img.shields.io/github/actions/workflow/status/ignsm/formhaus/ci.yml?branch=main&label=tests" alt="Tests"></a>
  <a href="https://www.npmjs.com/package/@formhaus/core"><img src="https://img.shields.io/npm/v/@formhaus/core?label=npm" alt="npm"></a>
  <a href="https://bundlejs.com/?q=@formhaus/core"><img src="https://img.shields.io/bundlejs/size/@formhaus/core?label=core" alt="core size"></a>
  <a href="LICENSE"><img src="https://img.shields.io/github/license/ignsm/formhaus" alt="MIT license"></a>
</p>

<p align="center"><strong>The form framework for the AI era.</strong></p>

<p align="center">
  One JSON definition holds fields, validation, conditions, steps and branching.<br>
  Render it in your React or Vue app, or publish it as a hosted form.
</p>

<p align="center"><strong>React</strong> · <strong>Vue</strong> · <strong>MCP</strong> · <strong>Figma Plugin</strong></p>

<p align="center">
  <a href="https://formhaus.dev/guide/">Documentation</a> ·
  <a href="#quick-start">Get started</a> ·
  <a href="https://formhaus.dev/playground">Playground</a> ·
  <a href="https://formhaus.dev/cloud">Formhaus Cloud</a>
</p>

<br>

**Add Formhaus to your coding agent**

```bash
claude mcp add formhaus -- npx -y @formhaus/mcp
```

<sub>Writes, checks and repairs definitions locally, with no account. Works in Claude Code, Codex, Cursor and any MCP client · <a href="https://formhaus.dev/guide/mcp">Setup for each client</a></sub>

Two independent ways to use it:

- **Use the library.** MIT, no account, no key. The core is framework-agnostic and runs the form in any app; React and Vue renderers are ready to use. Your submit handler sends the data wherever you want. CI tests React 18 and 19, and Vue 3.3 and 3.5.

  ```bash
  npm install @formhaus/core   # plus @formhaus/react or @formhaus/vue
  ```

- **Use [Formhaus Cloud](https://formhaus.dev/cloud).** A hosted form backend: a submission endpoint with server validation, a dashboard and webhooks, plus hosted links, embeds and a visual builder. The first form needs no account.

  Build in the browser at [app.formhaus.dev](https://app.formhaus.dev/login), or add the remote MCP server and ask your agent: "Make me a waitlist form and give me the link."

  ```bash
  claude mcp add --transport http formhaus https://api.formhaus.dev/mcp
  ```

  [Cloud quickstart](https://formhaus.dev/cloud/quickstart) · [Connect Claude](https://formhaus.dev/cloud/connect-claude) · [Dashboard](https://formhaus.dev/cloud/dashboard) · [Pricing](https://formhaus.dev/cloud#pricing)

![An agent publishes a waitlist form, the hosted form takes a response, and the agent reads it back](docs/public/media/agent-publishes-a-form.gif)

## What you get

| Feature | |
|---|---|
| **One definition** | Fields, validation, conditional fields, steps, branching routes, sections and repeatable groups in one JSON file you keep in git |
| **React and Vue** | Native renderers with accessible defaults, or your own components through `components` |
| **Validation** | Built-in rules and custom validators. `validateSubmission()` checks the same definition on the server |
| **Agents** | The MCP server writes, validates and fixes definitions. Remote MCP publishes forms and reads responses |
| **i18n** | Translation catalogs and keys for labels, messages and options |
| **Accessibility** | Labels, error summary, focus management and live regions built in |
| **Small core** | Zero dependencies, tree-shakable ESM |
| **Figma** | The plugin renders mockups, flow maps and prototypes from the same definition |
| **Cloud, optional** | Hosted links, embeds, a submission endpoint, CSV export and webhooks |

## What it's for

- [Multi-step forms with branching](https://formhaus.dev/guide/steps.html#route-between-branches) in React or Vue.
- [Rendering a form from JSON with your own components](https://formhaus.dev/guide/fields.html#override-default-components).
- [Designing the form in Figma](https://formhaus.dev/guide/figma.html) from the same file.
- Generating and checking definitions with AI agents: [Claude Code skills](https://formhaus.dev/guide/formhaus-create-form.html), the [MCP server](https://formhaus.dev/guide/mcp.html) (`claude plugin marketplace add ignsm/formhaus && claude plugin install formhaus@formhaus`), the [JSON Schema](https://formhaus.dev/api/definition.html#json-schema) and the [format specification](https://formhaus.dev/spec.html).
- [Translated forms](https://formhaus.dev/guide/translations.html) with your own catalogs, or with i18next, vue-i18n and Lokalise keys.
- A [headless engine](https://formhaus.dev/api/form-engine.html) for Svelte or vanilla JS.

## Example

Business accounts get a company step; everyone converges on review.

```json
{
  "$schema": "https://formhaus.dev/schema/form-definition.json",
  "id": "signup",
  "title": "Sign up",
  "submit": { "label": "Create account" },
  "steps": [
    {
      "id": "account",
      "title": "Account",
      "fields": [
        { "key": "email", "type": "email", "label": "Email", "validation": { "required": true } },
        { "key": "kind", "type": "radio", "label": "Account type", "autoAdvance": true,
          "options": [{ "value": "personal", "label": "Personal" }, { "value": "business", "label": "Business" }] }
      ],
      "routes": [
        { "to": "company", "show": [{ "field": "kind", "eq": "business" }] },
        { "to": "review" }
      ]
    },
    { "id": "company", "title": "Company", "routes": [{ "to": "review" }],
      "fields": [{ "key": "company", "type": "text", "label": "Company name", "validation": { "required": true } }] },
    { "id": "review", "title": "Review",
      "fields": [{ "key": "terms", "type": "checkbox", "label": "I accept the terms", "validation": { "required": true } }] }
  ]
}
```

```tsx
import { FormRenderer } from '@formhaus/react';
import definition from './signup.json';

<FormRenderer definition={definition} onSubmit={save} />;
```

[Compare with react-hook-form, TanStack Form, react-jsonschema-form and SurveyJS →](https://formhaus.dev/compare/)

## Packages

| Package | Description | npm |
|---------|-------------|-----|
| `@formhaus/core` | Zero-dependency form engine: types, validation, visibility, multi-step | `npm i @formhaus/core` |
| `@formhaus/react` | React adapter with native HTML defaults and custom component support | `npm i @formhaus/core @formhaus/react` |
| `@formhaus/vue` | Vue 3 adapter with native HTML defaults and custom component support | `npm i @formhaus/core @formhaus/vue` |
| `@formhaus/mcp` | MCP server: validate definitions and simulate paths from AI agents | `claude mcp add formhaus -- npx -y @formhaus/mcp` |

`@formhaus/figma` generates form mockups on the Figma canvas. It is not on Figma Community yet; build it locally, then import `packages/figma/manifest.json`.

Svelte, Solid, or anything else: use `@formhaus/core` directly. The [playground](https://formhaus.dev/playground.html) has a Svelte example.

## Install

```bash
npm install @formhaus/core
```

If you need a framework adapter:

```bash
npm install @formhaus/core @formhaus/react   # React
npm install @formhaus/core @formhaus/vue     # Vue
```

Or use `@formhaus/core` directly with any framework. See the [Svelte example](https://formhaus.dev/playground.html).

## Quick start

### Define a form

Write the JSON by hand, or use the [`/formhaus:formhaus-create-form`](https://formhaus.dev/guide/formhaus-create-form.html) Claude Code skill to generate it from a text description, a CSV table, or a screenshot of an existing form.

```json
{
  "$schema": "https://formhaus.dev/schema/form-definition.json",
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

By default, both adapters render native HTML inputs. A step can hide Next with `next: false`, and cancellable async hooks run before and after navigation and submission. See [lifecycle hooks](https://formhaus.dev/guide/steps.html#lifecycle-hooks).

## Custom components

Both adapters accept a `components` prop (a `FieldComponentMap`) that lets you swap native HTML inputs for your own UI kit.

<details>
<summary><b>React</b></summary>

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

</details>

<details>
<summary><b>Vue</b></summary>

```vue
<!-- MyTextInput.vue -->
<script setup lang="ts">
import type { FormFieldProps } from '@formhaus/vue';

const props = defineProps<FormFieldProps>();
const emit = defineEmits<{ (e: 'update:modelValue', value: unknown): void }>();
</script>

<template>
  <label>{{ props.field.label }}</label>
  <input
    :value="(props.modelValue as string) ?? ''"
    @input="emit('update:modelValue', ($event.target as HTMLInputElement).value)"
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

</details>

Each field component receives the full `FormField` descriptor, the current value, and any validation error. Implement as many or as few field types as you need. Unmapped types fall back to native HTML.

## Figma plugin

`@formhaus/figma` renders form definitions in Figma with built-in Material 3 and iOS-like kits or with your own components. Branching forms get a flow map, multi-step forms a clickable prototype, and a generated form can be selected, edited and updated in place.

![The Formhaus plugin editing a branching form next to its flow map](docs/public/figma/hero.png)

<img src="docs/public/figma/prototype.gif" alt="Clicking through a generated prototype" width="560">

The [`/formhaus:formhaus-figma-connect`](https://formhaus.dev/guide/formhaus-figma-connect.html) Claude Code skill binds your library's components to the plugin. See the [plugin guide](https://formhaus.dev/guide/figma.html) for local installation.

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md).

## License

[MIT](LICENSE)

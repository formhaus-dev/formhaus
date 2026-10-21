# @formhaus/core

Framework-free engine for JSON form definitions: field state, validation, conditional visibility, repeatable groups, multi-step navigation and branching routes. No runtime dependencies and no UI. Part of [Formhaus](https://github.com/formhaus-dev/formhaus). For rendering, use [`@formhaus/react`](https://www.npmjs.com/package/@formhaus/react) or [`@formhaus/vue`](https://www.npmjs.com/package/@formhaus/vue).

## Install

```bash
npm install @formhaus/core
```

Requires Node 22.12 or later. ESM; `require()` works too.

## Usage

```ts
import { FormEngine, type FormDefinition } from '@formhaus/core';

const definition: FormDefinition = {
  id: 'contact',
  title: 'Contact Us',
  submit: { label: 'Send' },
  fields: [
    { key: 'name', type: 'text', label: 'Name', validation: { required: true } },
    { key: 'email', type: 'email', label: 'Email', validation: { required: true } },
  ],
};

const engine = new FormEngine(definition);

engine.setValue('name', 'Jane');
engine.validate();
// { email: 'This field is required' }

engine.setValue('email', 'jane@example.com');
engine.getSubmitValues();
// { name: 'Jane', email: 'jane@example.com' }
```

## Entry points

| Import | Contents |
|--------|----------|
| `@formhaus/core` | `FormEngine`, `checkDefinition()`, types |
| `@formhaus/core/server` | `validateSubmission()` for untrusted payloads, also as `server.iife.js` |
| `@formhaus/core/cloud` | Client for [Formhaus Cloud](https://formhaus.dev/cloud/overview): `fetchForm()`, `createSubmitter()`, `createChallengeFrame()` |
| `@formhaus/core/i18n` | Message and label catalogs, overlays, translation keys |
| `@formhaus/core/fix` | `suggestFixes()`, `applyFix()`, `fixAll()` |
| `@formhaus/core/style.css` | Optional baseline styles with `--fh-*` theme tokens |
| `@formhaus/core/schema.json` | JSON Schema of the definition |

`@formhaus/core/internal` holds code shared by `@formhaus/react` and `@formhaus/vue`. It is not a public API and has no semver guarantee: any release can change it. Do not import it.

## Features

- Field types, validation rules, `show` / `showAny` conditions, sections and [repeatable groups](https://formhaus.dev/guide/groups). See [fields](https://formhaus.dev/guide/fields) and [validation](https://formhaus.dev/guide/validation).
- [Multi-step forms](https://formhaus.dev/guide/steps) with lifecycle hooks, async step validation and [branching routes](https://formhaus.dev/guide/steps#route-between-branches). `goToStep(id)` opens a step for [URL routing](https://formhaus.dev/recipes/steps-in-url): if the step can't be opened, the form opens the previous available step and reports it.
- [Server-side validation](https://formhaus.dev/guide/server-validation) against the same definition.
- [Form events](https://formhaus.dev/api/form-engine#form-events): pass `onFormEvent` and call `start()` to get `form_viewed`, `step_viewed`, `field_shown`, `form_submit_succeeded` and more.
- Granular subscriptions: `subscribe()`, `subscribeField()`, `subscribeStructure()` and `subscribeValues()`.
- [Translations](https://formhaus.dev/guide/translations) through catalogs and overlay files.
- Definition checks and JSON Patch [fix suggestions](https://formhaus.dev/api/form-engine) through `checkDefinition()` and `@formhaus/core/fix`.
- [Formhaus Cloud](https://formhaus.dev/guide/endpoint): hosted endpoint, submissions, files and bot check. `FormhausForm` in `@formhaus/react/cloud` and `@formhaus/vue/cloud` renders a published form.
- [Theming](https://formhaus.dev/guide/#optional-baseline-styles): `import '@formhaus/core/style.css'`, then override `--fh-*` custom properties. A dark theme is on with `data-fh-theme="dark"`.
- [Claude Code skill and MCP server](https://formhaus.dev/guide/mcp) to generate and check definitions.

## Docs

- [Guide](https://formhaus.dev/guide/), [API reference](https://formhaus.dev/api/form-engine) and [recipes](https://formhaus.dev/recipes/)
- [Framework overview](https://formhaus.dev/) and [playground](https://formhaus.dev/playground)
- [Source and issues](https://github.com/formhaus-dev/formhaus)

## License

MIT

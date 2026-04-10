# @formhaus/core

Framework-agnostic form engine. Types, validation, visibility, multi-step navigation, async step validation. Zero runtime dependencies, ESM-only.

Part of [Formhaus](https://github.com/ignsm/formhaus). For React, use `@formhaus/react`. For Vue, use `@formhaus/vue`.

## Install

```bash
npm install @formhaus/core
```

Requires Node ≥18.

## Generating a definition

Write the JSON by hand, or use the [`/formhaus-create-form`](https://formhaus.dev/guide/formhaus-create-form.html) Claude Code skill to generate it from a text description, a CSV table, or a screenshot of an existing form.

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
const errors = engine.validate();
// { email: 'This field is required' }

engine.setValue('email', 'jane@example.com');
engine.validate();
// {}

engine.getSubmitValues();
// { name: 'Jane', email: 'jane@example.com' }
```

## What it covers

- Form state with reactive `subscribe()` / `getSnapshot()` for adapters
- Field validation (required, min/max, pattern, matchField, custom validators)
- Visibility conditions (`show` / `showAny`) with cascade-clearing of hidden values
- Multi-step forms with conditional steps and per-step validation
- Async step validation via `onStepValidate` + `nextStepAsync()`
- Definition validation (duplicate keys, invalid regex, circular show conditions)

## Docs

- Full guide and API reference: https://formhaus.dev
- Live playground: https://formhaus.dev/playground.html
- Source and issues: https://github.com/ignsm/formhaus

## License

MIT

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

## Optional baseline styles

The default React and Vue field components render unstyled HTML with `fh-*` class names. For a sensible starting look (padding, focus states, error colour, button styles), import the optional stylesheet:

```ts
import '@formhaus/core/style.css';
```

Theme via CSS custom properties (`--fh-color-primary`, `--fh-radius`, `--fh-gap`, etc.) — no need to fork the file. If you're using a UI kit through the `components` prop, the stylesheet doesn't affect those.

## What it covers

- Form state with reactive `subscribe()` / `getSnapshot()` for adapters
- Per-field and structure subscriptions for renderers that need isolated updates
- Field validation (required, min/max, pattern, matchField, custom validators)
- Visibility conditions (`show` / `showAny`) with cascade-clearing of hidden values
- Multi-step forms with conditional steps and per-step validation
- Async step validation via `onStepValidate` + `nextStepAsync()`
- Definition validation (duplicate keys, invalid regex, circular show conditions)

## Granular subscriptions

`subscribe()` notifies on every engine update. Renderers can subscribe more narrowly so a change to one field does not update every field component:

```ts
const unsubscribe = engine.subscribeField('email', () => {
  const value = engine.values.email;
  const error = engine.errors.email;
  renderEmail({ value, error });
});

engine.getFieldSnapshot('email');
```

Use `subscribeStructure()` and `getStructureSnapshot()` for visible field lists, visible steps, and navigation. Every subscribe method returns an unsubscribe function.

## Docs

- Full guide and API reference: https://formhaus.dev
- Live playground: https://formhaus.dev/playground.html
- Source and issues: https://github.com/ignsm/formhaus

## License

MIT

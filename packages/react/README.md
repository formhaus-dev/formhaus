# @formhaus/react

Renders a JSON form definition in React: multi-step, conditional and branching forms on top of [`@formhaus/core`](https://www.npmjs.com/package/@formhaus/core). Native HTML inputs by default. Part of [Formhaus](https://github.com/formhaus-dev/formhaus).

## Install

```bash
npm install @formhaus/core @formhaus/react
```

Requires React 18 or 19 and Node 22.12 or later.

## Usage

```tsx
import { FormRenderer } from '@formhaus/react';
import definition from './contact-form.json';

export function ContactPage() {
  async function handleSubmit(values: Record<string, unknown>) {
    await fetch('/api/contact', {
      method: 'POST',
      body: JSON.stringify(values),
    });
  }

  return <FormRenderer definition={definition} onSubmit={handleSubmit} />;
}
```

## Features

- Built-in field types, sections, repeatable groups and conditional visibility. See [fields](https://formhaus.dev/guide/fields).
- [Multi-step forms](https://formhaus.dev/guide/steps) with lifecycle hooks, radio `autoAdvance`, async step validation and [branching routes](https://formhaus.dev/guide/steps#route-between-branches).
- [Custom components](https://formhaus.dev/guide/custom-components) through the `components` prop (`FieldComponentMap`), plus `HeadlessFormRenderer` to keep the built-in fields out of your bundle. Integrations: [MUI, shadcn/ui](https://formhaus.dev/guide/integrations/mui).
- Dynamic select options with `optionsFrom` and `optionsProviders`. See [fields](https://formhaus.dev/guide/fields).
- [Form events](https://formhaus.dev/guide/custom-components#form-events) through `onFormEvent`, for analytics.
- [Translations](https://formhaus.dev/guide/translations): `useLocalizedForm()` from `@formhaus/react/i18n`.
- [Server-side validation](https://formhaus.dev/guide/server-validation) of the same definition with `@formhaus/core/server`.
- [Formhaus Cloud](https://formhaus.dev/guide/endpoint): `FormhausForm` from `@formhaus/react/cloud` renders a published form and submits to the hosted endpoint, with file uploads and the bot check.
- [Theming](https://formhaus.dev/guide/#optional-baseline-styles): `import '@formhaus/core/style.css'`, then override the `--fh-*` custom properties.
- [Server-side rendering](https://formhaus.dev/guide/integrations/nextjs) with Next.js.

### Formhaus Cloud

```tsx
import { FormhausForm } from '@formhaus/react/cloud';

<FormhausForm id="form_id" />
```

## Docs

- [Guide](https://formhaus.dev/guide/), [API reference](https://formhaus.dev/api/form-engine) and [recipes](https://formhaus.dev/recipes/)
- [Framework overview](https://formhaus.dev/) and [playground](https://formhaus.dev/play)
- [Source and issues](https://github.com/formhaus-dev/formhaus)

## License

MIT

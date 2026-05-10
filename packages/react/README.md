# @formhaus/react

React adapter for [Formhaus](https://github.com/ignsm/formhaus). Renders forms from a JSON definition with native HTML inputs by default. Drop in your own components via a `components` prop.

## Install

```bash
npm install @formhaus/core @formhaus/react
```

Requires React ≥18 and Node ≥18.

## Generating a definition

Write the form JSON by hand, or use the [`/formhaus-create-form`](https://formhaus.dev/guide/formhaus-create-form.html) Claude Code skill to generate it from a text description, a CSV table, or a screenshot of an existing form.

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

## Custom components

Swap native HTML for your own UI kit:

```tsx
import type { FieldComponentMap, FieldComponentProps } from '@formhaus/react';

function MyInput({ field, value, error, onChange, onBlur }: FieldComponentProps) {
  return (
    <div>
      <label>{field.label}</label>
      <input
        value={value as string}
        onChange={(e) => onChange(e.target.value)}
        onBlur={onBlur}
      />
      {error && <span className="error">{error}</span>}
    </div>
  );
}

const components: FieldComponentMap = { text: MyInput, email: MyInput };

<FormRenderer definition={definition} onSubmit={handleSubmit} components={components} />;
```

Unmapped field types fall back to native HTML.

## Server-side rendering

`FormRenderer` is SSR-safe. It works with Next.js static and dynamic prerender, plus React's `renderToString`, with no `next/dynamic` wrapper required.

## Optional baseline styles

By default the React adapter renders unstyled HTML. For a sensible starting look (padding, focus states, error colour, button styles) import the shared stylesheet:

```ts
import '@formhaus/core/style.css';
```

Theme via CSS custom properties (`--fh-color-primary`, `--fh-radius`, `--fh-gap`, etc.). If you bring your own components via the `components` prop (MUI, Tailwind, shadcn), the stylesheet doesn't apply to those.

## Docs

- Full guide and API reference: https://formhaus.dev
- Live playground: https://formhaus.dev/playground.html
- Source and issues: https://github.com/ignsm/formhaus

## License

MIT

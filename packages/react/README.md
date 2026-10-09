# @formhaus/react

`@formhaus/react` renders a JSON form definition in React, including multi-step, conditional and branching forms. It uses native HTML inputs by default; pass your own components through the `components` prop. Part of [Formhaus](https://github.com/ignsm/formhaus).

## Install

```bash
npm install @formhaus/core @formhaus/react
```

Requires React ≥18 and Node ≥18.

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

## Generating a definition

Write the form JSON by hand, or use the [`/formhaus:formhaus-create-form`](https://formhaus.dev/guide/formhaus-create-form.html) Claude Code skill to generate it from a text description, a CSV table, or a screenshot of an existing form.

## Navigation and submission

`FormRenderer` and `HeadlessFormRenderer` support radio `autoAdvance`, `next: false`, and async before/after navigation and submission hooks. React awaits `onSubmit` and keeps the form busy until it settles. Custom fields use `onCommit(value)` for activation; custom actions honor `showPrimary`. See [examples and lifecycle semantics](https://formhaus.dev/guide/steps.html#lifecycle-hooks).

Step `routes` choose an ordered forward path from answers. Back, progress, validation and submission follow that path. See [branching and retained answers](https://formhaus.dev/guide/steps.html#route-between-branches).

## Custom components

Swap native HTML for your own UI kit:

```tsx
import type { FieldComponentMap, FieldComponentProps } from '@formhaus/react';

function MyInput({ field, value, error, onChange, onBlur }: FieldComponentProps) {
  return (
    <div>
      <label>{field.label}</label>
      <input
        value={(value as string) ?? ''}
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

### Headless renderer

`FormRenderer` imports the built-in native fields, so they stay in your bundle even when you replace them. If you map every field type you use, import `HeadlessFormRenderer` instead. It takes the same props as `FormRenderer`. It does not import the built-in fields, actions or step progress, so they stay out of your bundle.

`HeadlessFormRenderer` has no fallbacks. An unmapped field type renders an "Unsupported field type" placeholder. Pass `ActionsComponent` and `ProgressComponent` too, or the form renders no buttons and no progress bar.

## Dynamic options

Use `optionsFrom` to load select-like options and `optionsDependsOn` to rerun the provider when another field changes:

```tsx
import { FormRenderer, type OptionsProvider } from '@formhaus/react';

const loadCities: OptionsProvider = async (values) => {
  const response = await fetch(`/api/cities?country=${values.country ?? ''}`);
  return response.json();
};

<FormRenderer
  definition={definition}
  optionsProviders={{ cities: loadCities }}
  onSubmit={handleSubmit}
/>
```

```json
{
  "key": "city",
  "type": "select",
  "label": "City",
  "optionsFrom": "cities",
  "optionsDependsOn": ["country"]
}
```

The provider receives all current values. If requests overlap, only the latest result is used.

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

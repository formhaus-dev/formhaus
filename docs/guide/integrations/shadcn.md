---
title: "shadcn/ui integration"
description: "Render Formhaus JSON forms with shadcn/ui: map Input, Textarea, Select, Checkbox, RadioGroup and Button to field types through the components prop."
---

# shadcn/ui

Map shadcn/ui components to Formhaus field types through the `components` prop of `FormRenderer`.

[Open in StackBlitz](https://stackblitz.com/github/formhaus-dev/formhaus/tree/main/examples/react-shadcn) · [Source](https://github.com/formhaus-dev/formhaus/tree/main/examples/react-shadcn)

## Setup

The example is a Vite project with Tailwind CSS v4, created by the shadcn CLI with the Base UI primitives:

```bash
pnpm dlx shadcn@latest init --template vite --base base --preset nova
pnpm dlx shadcn@latest add input select checkbox radio-group button label card textarea
pnpm add @formhaus/core @formhaus/react
```

## Component map

[`mapControls`](/guide/design-systems) maps one shadcn/ui control per field type. Types without an entry fall back to the built-in HTML fields.

<<< @/../examples/react-shadcn/src/component-map.tsx

## Shell

One shell renders the label, the helper, the error and the required mark for every control:

<<< @/../examples/react-shadcn/src/fields/Shell.tsx

## Choices

Radio, scale, rating and multiselect options, with image tiles when the options have images:

<<< @/../examples/react-shadcn/src/fields/choices.tsx

The Base UI `Select` takes the options as `items`, so `SelectValue` shows the option label instead of the stored value:

<<< @/../examples/react-shadcn/src/fields/SelectControl.tsx

## Next.js

The component map holds functions that cannot cross from a server component. Render `FormRenderer` with the map in a file that starts with `'use client'`, and import that file from the server component. See [Next.js](/guide/integrations/nextjs#client-component).

## Actions and progress

<<< @/../examples/react-shadcn/src/FormActions.tsx

<<< @/../examples/react-shadcn/src/StepProgress.tsx

## App

<<< @/../examples/react-shadcn/src/App.tsx

`FormRenderer` wraps fields in `.fh-form` and `.fh-form__fields`. Without `@formhaus/core/style.css`, add the spacing in your stylesheet:

```css
@layer components {
  .fh-form,
  .fh-form__fields {
    @apply grid gap-5;
  }
}
```

## Server validation

The example validates in the browser only. On the server, run `validateSubmission()` from `@formhaus/core/server` on the posted values and pass the returned errors to the `errors` prop. See [Server-side validation](/guide/server-validation) and [Next.js](/guide/integrations/nextjs) for a complete route handler.

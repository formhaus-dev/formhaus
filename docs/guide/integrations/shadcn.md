---
title: "shadcn/ui integration"
description: "Render Formhaus JSON forms with shadcn/ui: map Input, Select, Checkbox, RadioGroup and Button to field types through the React components prop."
---

# shadcn/ui

Map shadcn/ui components to Formhaus field types through the `components` prop of `FormRenderer`.

[Open in StackBlitz](https://stackblitz.com/github/ignsm/formhaus/tree/main/examples/react-shadcn) · [Source](https://github.com/ignsm/formhaus/tree/main/examples/react-shadcn)

## Setup

The example is a Vite project with Tailwind CSS v4, created by the shadcn CLI with the Base UI primitives:

```bash
pnpm dlx shadcn@latest init --template vite --base base --preset nova
pnpm dlx shadcn@latest add input select checkbox radio-group button label card
pnpm add @formhaus/core @formhaus/react
```

## Component map

Each key is a field type. Types without an entry fall back to the built-in HTML fields.

<<< @/../examples/react-shadcn/src/component-map.ts

## Fields

Every field receives `FieldComponentProps`: the `field` definition, `value`, `error`, `loading`, `disabled`, `onChange` and `onBlur`.

<<< @/../examples/react-shadcn/src/fields/FieldShell.tsx

<<< @/../examples/react-shadcn/src/fields/TextField.tsx

The Base UI `Select` takes the options as `items`, so `SelectValue` shows the option label instead of the stored value:

<<< @/../examples/react-shadcn/src/fields/SelectField.tsx

<<< @/../examples/react-shadcn/src/fields/RadioField.tsx

<<< @/../examples/react-shadcn/src/fields/CheckboxField.tsx

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

## Server re-validation

The example validates in the browser only. To check the same rules on the server, build a `FormEngine` from the same definition and call `validate()`, then pass the returned errors to the `errors` prop. See [Next.js](/guide/integrations/nextjs#how-server-re-validation-works) for a complete route handler.

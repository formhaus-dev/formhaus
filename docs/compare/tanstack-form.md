---
title: "Formhaus vs TanStack Form"
description: "Formhaus vs TanStack Form: JSON definition or typed code, multi-step and branching, validation, frameworks, bundle size and AI tooling, with migration."
---

# Formhaus vs TanStack Form

TanStack Form is headless, type-safe form state that you drive from TypeScript code in React, Vue, Angular, Solid, Lit and Svelte; Formhaus is a JSON definition with steps, routes and conditions that an engine runs and React, Vue and Figma render. When developers write the form and want full type inference over values and Standard Schema validation, TanStack Form is the better fit. When the form is data that changes without a deploy, branches between steps, or has to match a Figma design, Formhaus covers it from one file.

## Choose TanStack Form when

- You want value and field types inferred from runtime defaults without passing generics ([philosophy](https://tanstack.com/form/latest/docs/philosophy)).
- The app uses Angular, Solid, Svelte or Lit. TanStack Form ships adapters for them ([installation](https://tanstack.com/form/latest/docs/installation)); Formhaus renders React and Vue.
- Validation already lives in Zod, Valibot, ArkType or Effect Schema. TanStack Form accepts any Standard Schema validator ([validation guide](https://tanstack.com/form/latest/docs/framework/react/guides/validation)).
- You need form-level and field-level async validators with debounce, such as `onChangeAsyncDebounceMs` ([validation guide](https://tanstack.com/form/latest/docs/framework/react/guides/validation)).

## Choose Formhaus when

- Forms come from a CMS, an API, a product team or an AI agent, and change without a deploy.
- Steps depend on answers. Formhaus routes between steps from the definition instead of from component state.
- The same form must be drawn in Figma with your design system.
- AI agents generate forms and you want them checked against the JSON Schema and the real engine.

## Feature comparison

| | Formhaus | TanStack Form |
|---|---|---|
| Definition format | JSON, checked by a [JSON Schema](/api/definition#json-schema) | TypeScript code with `useForm` and `form.Field` ([overview](https://tanstack.com/form/latest/docs/overview)) |
| Multi-step | Built in: `steps`, per-step validation, progress ([guide](/guide/steps)) | Example with one form and the current step in React state ([multi-step wizard example](https://github.com/TanStack/form/tree/main/examples/react/multi-step-wizard)) |
| Branching routes | `routes` on a step ([guide](/guide/steps#route-between-branches)) | Written in your step state code ([multi-step wizard example](https://github.com/TanStack/form/tree/main/examples/react/multi-step-wizard)) |
| Conditional fields | `show` / `showAny`; hidden values cleared ([guide](/guide/conditions)) | Render based on subscribed values ([reactivity guide](https://tanstack.com/form/latest/docs/framework/react/guides/reactivity)) |
| Validation | Declarative rules, named validators, async step validation ([guide](/guide/validation)) | Functions or Standard Schema, sync and async, per field or form ([validation guide](https://tanstack.com/form/latest/docs/framework/react/guides/validation)) |
| Custom components | `components` map per field type ([guide](/guide/custom-components)) | Headless; examples for Mantine, Material UI, shadcn/ui and Chakra UI ([UI libraries](https://tanstack.com/form/latest/docs/framework/react/guides/ui-libraries)) |
| Figma | Plugin draws the definition ([guide](/guide/figma)) | Not documented |
| AI tooling | JSON Schema, [MCP server](/guide/mcp), Claude Code plugin | Forms are code; docs published as [llms.txt](https://tanstack.com/form/latest/llms.txt) |
| Frameworks | React 18+, Vue 3.3+, headless engine | React, Vue, Angular, Solid, Lit, Svelte ([installation](https://tanstack.com/form/latest/docs/installation)) |
| Bundle size (gzipped) | 6.2 KB core + 4.8 KB React | 17.4 KB for `@tanstack/react-form` 1.33.5 ([bundlephobia](https://bundlephobia.com/package/@tanstack/react-form@1.33.5)) |
| License | MIT | MIT ([npm](https://www.npmjs.com/package/@tanstack/react-form)) |

Sizes measured on 2026-10-09. See [how Formhaus sizes are measured](/compare/#formhaus-at-a-glance).

## Migration

The same sign-up form: email, plan, and a company field only for the Team plan.

### TanStack Form

```tsx
import { useForm } from '@tanstack/react-form';

type Values = { email: string; plan: string; company: string };

const required = (message: string) => ({ value }: { value: string }) => (value ? undefined : message);

export function Signup({ onDone }: { onDone: (values: Values) => void }) {
  const form = useForm({
    defaultValues: { email: '', plan: '', company: '' },
    onSubmit: ({ value }) => onDone(value),
  });

  return (
    <form onSubmit={(event) => { event.preventDefault(); form.handleSubmit(); }}>
      <form.Field
        name="email"
        validators={{
          onSubmit: ({ value }) =>
            !value ? 'Enter your email' : /^\S+@\S+$/.test(value) ? undefined : 'Enter a valid email',
        }}
      >
        {(field) => (
          <label>
            Email
            <input type="email" value={field.state.value} onChange={(e) => field.handleChange(e.target.value)} />
            {field.state.meta.errors[0] && <p>{field.state.meta.errors[0]}</p>}
          </label>
        )}
      </form.Field>
      <form.Field name="plan" validators={{ onSubmit: required('This field is required') }}>
        {(field) => (
          <label>
            Plan
            <select value={field.state.value} onChange={(e) => field.handleChange(e.target.value)}>
              <option value="">Choose</option>
              <option value="solo">Solo</option>
              <option value="team">Team</option>
            </select>
            {field.state.meta.errors[0] && <p>{field.state.meta.errors[0]}</p>}
          </label>
        )}
      </form.Field>
      <form.Subscribe selector={(state) => state.values.plan}>
        {(plan) =>
          plan === 'team' && (
            <form.Field name="company" validators={{ onSubmit: required('Enter your company') }}>
              {(field) => (
                <label>
                  Company
                  <input value={field.state.value} onChange={(e) => field.handleChange(e.target.value)} />
                  {field.state.meta.errors[0] && <p>{field.state.meta.errors[0]}</p>}
                </label>
              )}
            </form.Field>
          )
        }
      </form.Subscribe>
      <button type="submit">Create account</button>
    </form>
  );
}
```

### Formhaus

<<< @/compare/definitions/signup.json

```tsx
import { FormRenderer } from '@formhaus/react';
import type { FormDefinition } from '@formhaus/core';
import signup from './signup.json';

const definition = signup as FormDefinition;

export function Signup({ onDone }: { onDone: (values: Record<string, unknown>) => void }) {
  return <FormRenderer definition={definition} onSubmit={onDone} />;
}
```

Field validators become `validation` rules, the `form.Subscribe` check becomes a `show` condition, and Formhaus leaves `company` out of the submitted values when it is hidden. Values are typed as `Record<string, unknown>`, so narrow them in `onSubmit`.

## Related

- [Compare overview](/compare/)
- [Multi-step with branching recipe](/recipes/multi-step-branching)
- [Headless engine recipe](/recipes/headless-engine)

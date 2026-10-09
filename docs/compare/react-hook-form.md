---
title: "Formhaus vs react-hook-form"
description: "Formhaus vs react-hook-form: JSON definition or React code, multi-step and branching, validation, bundle size, Figma and AI tooling, with migration code."
---

# Formhaus vs react-hook-form

react-hook-form is a hook for forms you write in React code; Formhaus is a JSON definition that an engine runs and React, Vue and Figma render. For one hand-written React form, react-hook-form is the more flexible choice with a smaller API surface. For multi-step flows with branching, forms stored as data, or forms that also live in Figma, Formhaus does that work without extra code.

## Choose react-hook-form when

- The form is written and maintained by developers in React, and its markup is custom.
- You already validate with Zod, Yup or another schema library. react-hook-form plugs them in through a [`resolver`](https://react-hook-form.com/docs/useform#resolver).
- You need field arrays, fine-grained re-render control or a large ecosystem of examples. The [`useFieldArray`](https://react-hook-form.com/docs/usefieldarray) hook covers dynamic lists.
- The app is React only. react-hook-form supports React 16.8 through 19 ([npm](https://www.npmjs.com/package/react-hook-form)).

## Choose Formhaus when

- The form is data: it comes from a CMS, an API, a product team or an AI agent, and changes without a deploy.
- The flow has steps that depend on answers. Formhaus has `steps`, `routes` and conditional steps in the definition.
- The same form must render in React and Vue, or be drawn in Figma from the same file.
- AI agents generate or edit forms. The JSON Schema and the MCP server check their output against the real engine.

## Feature comparison

| | Formhaus | react-hook-form |
|---|---|---|
| Definition format | JSON, checked by a [JSON Schema](/api/definition#json-schema) | React code with `register` and `useForm` ([docs](https://react-hook-form.com/docs/useform)) |
| Multi-step | Built in: `steps`, per-step validation, progress ([guide](/guide/steps)) | Pattern: one form per page, answers kept in a state library ([Wizard Form / Funnel](https://react-hook-form.com/advanced-usage#WizardFormFunnel)) |
| Branching routes | `routes` on a step ([guide](/guide/steps#route-between-branches)) | Written in your router or state code ([Wizard Form / Funnel](https://react-hook-form.com/advanced-usage#WizardFormFunnel)) |
| Conditional fields | `show` / `showAny`; hidden values cleared ([guide](/guide/conditions)) | Render based on [`watch`](https://react-hook-form.com/docs/useform/watch); unmounted values dropped with [`shouldUnregister`](https://react-hook-form.com/docs/useform#shouldUnregister) |
| Validation | Declarative rules, named validators, async step validation ([guide](/guide/validation)) | Rules in `register`, or a schema `resolver` ([docs](https://react-hook-form.com/docs/useform#resolver)) |
| Custom components | `components` map per field type ([guide](/guide/custom-components)) | Any component through [`Controller`](https://react-hook-form.com/docs/usecontroller/controller) |
| Figma | Plugin draws the definition ([guide](/guide/figma)) | Not documented |
| AI tooling | JSON Schema, [MCP server](/guide/mcp), Claude Code plugin | Forms are code; a web [Form Builder](https://react-hook-form.com/form-builder) generates React code |
| Frameworks | React 18+, Vue 3.3+, headless engine | React ([npm](https://www.npmjs.com/package/react-hook-form)) |
| Bundle size (gzipped) | 6.2 KB core + 4.8 KB React | 14.4 KB for 7.89.0 ([bundlephobia](https://bundlephobia.com/package/react-hook-form@7.89.0)) |
| License | MIT | MIT ([npm](https://www.npmjs.com/package/react-hook-form)) |

Sizes measured on 2026-10-09. See [how Formhaus sizes are measured](/compare/#formhaus-at-a-glance).

## Migration

The same sign-up form: email, plan, and a company field only for the Team plan.

### react-hook-form

```tsx
import { useForm } from 'react-hook-form';

type Values = { email: string; plan: string; company?: string };

export function Signup({ onDone }: { onDone: (values: Values) => void }) {
  const { register, handleSubmit, watch, formState: { errors } } = useForm<Values>({
    shouldUnregister: true,
  });
  const plan = watch('plan');

  return (
    <form onSubmit={handleSubmit(onDone)}>
      <label>
        Email
        <input
          type="email"
          {...register('email', {
            required: 'Enter your email',
            pattern: { value: /^\S+@\S+$/, message: 'Enter a valid email' },
          })}
        />
      </label>
      {errors.email && <p>{errors.email.message}</p>}
      <label>
        Plan
        <select {...register('plan', { required: 'This field is required' })}>
          <option value="">Choose</option>
          <option value="solo">Solo</option>
          <option value="team">Team</option>
        </select>
      </label>
      {errors.plan && <p>{errors.plan.message}</p>}
      {plan === 'team' && (
        <label>
          Company
          <input {...register('company', { required: 'Enter your company' })} />
        </label>
      )}
      {errors.company && <p>{errors.company.message}</p>}
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

Rules move from `register` options to `validation`, the `watch` check becomes a `show` condition, and labels, options and error rendering come from the definition. To keep your own inputs, map them with the `components` prop.

## Related

- [Compare overview](/compare/)
- [Conditional fields recipe](/recipes/conditional-fields)
- [Multi-step with branching recipe](/recipes/multi-step-branching)

---
title: "Compared with react-jsonschema-form"
description: "Formhaus vs react-jsonschema-form: form definition or JSON Schema, multi-step, conditional fields, themes, bundle size and AI tooling, with migration code."
---

# Formhaus vs react-jsonschema-form

react-jsonschema-form (rjsf) builds a React form from a JSON Schema that describes your data, with a `uiSchema` for presentation; Formhaus uses a form definition that describes the form itself: fields, steps, routes and conditions. If your data model already exists as a JSON Schema and you want a form for it with one of many UI themes, rjsf is the better choice. If you design the form as a flow with steps and branching, render it in Vue as well as React, or draw it in Figma, Formhaus fits that directly.

## Choose react-jsonschema-form when

- The data model is already a JSON Schema, from an API, OpenAPI spec or backend, and the form should follow it.
- You need nested objects, arrays and `oneOf` choices generated from the schema ([oneOf, anyOf and allOf](https://rjsf-team.github.io/react-jsonschema-form/docs/json-schema/oneof)).
- You want a ready theme: Ant Design, Chakra UI, Fluent UI, Mantine, MUI, PrimeReact, React Bootstrap, Semantic UI or shadcn ([themes](https://rjsf-team.github.io/react-jsonschema-form/docs/usage/themes)).
- Validation should be standard JSON Schema validation through Ajv ([validation](https://rjsf-team.github.io/react-jsonschema-form/docs/usage/validation)).

## Choose Formhaus when

- The form has steps. The rjsf docs have no step API. A [closed 2017 issue](https://github.com/rjsf-team/react-jsonschema-form/issues/464) discussed swapping the schema per step in your own code.
- Fields appear based on answers with simple rules (`eq`, `in`, `notEmpty`) rather than JSON Schema `dependencies` and `oneOf`.
- The app uses Vue, or the form has to be drawn in Figma.
- AI agents write forms, and you want an MCP server that validates them and simulates every step path.

## Feature comparison

| | Formhaus | react-jsonschema-form |
|---|---|---|
| Definition format | Form definition JSON, checked by a [JSON Schema](/api/definition#json-schema) | JSON Schema for data plus `uiSchema` for presentation ([uiSchema](https://rjsf-team.github.io/react-jsonschema-form/docs/api-reference/uiSchema)) |
| Multi-step | Built in: `steps`, per-step validation, progress ([guide](/guide/steps)) | No step API in the [docs](https://rjsf-team.github.io/react-jsonschema-form/docs/) |
| Branching routes | `routes` on a step ([guide](/guide/steps#route-between-branches)) | No routing API in the [docs](https://rjsf-team.github.io/react-jsonschema-form/docs/) |
| Conditional fields | `show` / `showAny`; hidden values cleared ([guide](/guide/conditions)) | Schema `dependencies`, including `oneOf` for dynamic fields ([dependencies](https://rjsf-team.github.io/react-jsonschema-form/docs/json-schema/dependencies)) |
| Validation | Declarative rules, named validators, async step validation ([guide](/guide/validation)) | JSON Schema via a validator package, `customValidate`, `transformErrors`, `extraErrors` for server errors ([validation](https://rjsf-team.github.io/react-jsonschema-form/docs/usage/validation)) |
| Custom components | `components` map per field type ([guide](/guide/custom-components)) | Custom widgets, fields and templates ([custom widgets and fields](https://rjsf-team.github.io/react-jsonschema-form/docs/advanced-customization/custom-widgets-fields)) |
| Figma | Plugin draws the definition ([guide](/guide/figma)) | Not documented |
| AI tooling | JSON Schema, [MCP server](/guide/mcp), Claude Code plugin | Input is standard JSON Schema ([docs](https://rjsf-team.github.io/react-jsonschema-form/docs/)); no AI tooling documented |
| Frameworks | React 18 and 19, Vue 3.3.3+, headless engine | React 18+ ([npm](https://www.npmjs.com/package/@rjsf/core)) |
| Bundle size (gzipped) | <!-- size:react:start -->33.4 KB<!-- size:react:end --> core + React | <!-- size:rjsf:start -->125.3 KB for `@rjsf/core` + `@rjsf/validator-ajv8` 6.11.0<!-- size:rjsf:end -->; other themes are separate packages ([how it's measured](/guide/bundle-size)) |
| License | MIT | Apache-2.0 ([docs](https://rjsf-team.github.io/react-jsonschema-form/docs/)) |

Sizes measured on 2026-10-09. See [how Formhaus sizes are measured](/compare/#formhaus-at-a-glance).

## Migration

The same sign-up form: email, plan, and a company field only for the Team plan.

### react-jsonschema-form

```tsx
import Form from '@rjsf/core';
import validator from '@rjsf/validator-ajv8';
import type { RJSFSchema, UiSchema } from '@rjsf/utils';

const schema: RJSFSchema = {
  title: 'Sign up',
  type: 'object',
  required: ['email', 'plan'],
  properties: {
    email: { type: 'string', title: 'Email', pattern: '^\\S+@\\S+$' },
    plan: {
      type: 'string',
      title: 'Plan',
      oneOf: [
        { const: 'solo', title: 'Solo' },
        { const: 'team', title: 'Team' },
      ],
    },
  },
  dependencies: {
    plan: {
      oneOf: [
        { properties: { plan: { enum: ['solo'] } } },
        {
          properties: { plan: { enum: ['team'] }, company: { type: 'string', title: 'Company' } },
          required: ['company'],
        },
      ],
    },
  },
};

const uiSchema: UiSchema = {
  'ui:submitButtonOptions': { submitText: 'Create account' },
};

export function Signup({ onDone }: { onDone: (values: Record<string, unknown>) => void }) {
  return (
    <Form
      schema={schema}
      uiSchema={uiSchema}
      validator={validator}
      onSubmit={({ formData }) => onDone(formData)}
    />
  );
}
```

### Formhaus

<<< @/compare/definitions/signup.json

```tsx
import { FormRenderer } from '@formhaus/react';
import { parseDefinition } from '@formhaus/core';
import signup from './signup.json';

const definition = parseDefinition(signup);

export function Signup({ onDone }: { onDone: (values: Record<string, unknown>) => void }) {
  return <FormRenderer definition={definition} onSubmit={onDone} />;
}
```

`properties` become `fields`, `required` moves into each field's `validation`, and the `dependencies` block becomes one `show` condition on `company`. Error messages live next to each rule instead of in `transformErrors`. Nested objects and arrays have no Formhaus equivalent; keep those forms on rjsf.

## Related

- [Compare overview](/compare/)
- [Conditional fields recipe](/recipes/conditional-fields)
- [Definition reference](/api/definition)

---
title: "Compared with JSON Forms"
description: "Formhaus vs JSON Forms: form definition or JSON Schema with a UI schema, steps, branching, conditions, renderer sets and bundle size, with migration code."
---

# Formhaus vs JSON Forms

JSON Forms renders a form from a JSON Schema that describes your data and a UI schema that lays out the controls. Formhaus uses one form definition that describes the form itself: fields, steps, routes and conditions. If your data model already exists as a JSON Schema and you want Angular, Material UI or deeply nested data, JSON Forms is the better choice. If the form is a flow with steps and branches, renders in React and Vue, is drawn in Figma or is written by an AI agent, Formhaus fits that directly.

## Choose JSON Forms when

- The data model is already a JSON Schema, from an API, OpenAPI spec or backend, and the form should follow it ([UI schema](https://jsonforms.io/docs/uischema/)).
- The app is in Angular, or you want Material UI controls out of the box ([renderer sets](https://jsonforms.io/docs/renderer-sets)).
- The data has arrays of objects, each item rendered with its own nested UI schema ([controls](https://jsonforms.io/docs/uischema/controls)). Formhaus groups do not nest.
- Validation should be standard JSON Schema validation through AJV, with backend errors passed in as `additionalErrors` ([validation](https://jsonforms.io/docs/validation)).

## Choose Formhaus when

- The form has steps. JSON Forms shows a `Categorization` as tabs, or as a stepper with `"variant": "stepper"` ([example](https://jsonforms.io/examples/categorization)). The stepper is in React Material, Vue Vanilla and Vue Vuetify; React Vanilla shows a category list and Angular Material shows tabs. `showNavButtons` adds Back and Next buttons, and Next does not validate the step ([source](https://github.com/eclipsesource/jsonforms/blob/v3.8.0/packages/material-renderers/src/layouts/MaterialCategorizationStepperLayout.tsx)). Formhaus validates each step on Continue and has skip, progress and a welcome screen ([guide](/guide/steps)).
- The next step depends on an answer. Formhaus has `routes` on a step ([guide](/guide/steps#route-between-branches)). JSON Forms can hide a category with a rule, and has no API that picks the next category ([docs](https://jsonforms.io/docs/)).
- Conditions should be short: `"show": [{ "field": "plan", "eq": "team" }]` instead of a `scope` and a JSON Schema per rule ([rules](https://jsonforms.io/docs/uischema/rules)).
- You want one file. Labels, order, steps and validation messages live in the definition, not in a schema and a UI schema.
- The form is drawn in Figma, or AI agents write it and you want an MCP server that checks it and walks every path.

## Feature comparison

| | Formhaus | JSON Forms |
|---|---|---|
| Definition format | One form definition, checked by a [JSON Schema](/api/definition#json-schema) | JSON Schema for data plus a UI schema for layout ([UI schema](https://jsonforms.io/docs/uischema/)) |
| Layout | Steps, sections, matrix sections, groups ([guide](/guide/sections)) | `VerticalLayout`, `HorizontalLayout`, `Group`, `Categorization` ([layouts](https://jsonforms.io/docs/uischema/layouts)) |
| Multi-step | Built in, with per-step validation, skip and progress ([guide](/guide/steps)) | `Categorization` as tabs or a stepper ([example](https://jsonforms.io/examples/categorization)); Next does not validate ([source](https://github.com/eclipsesource/jsonforms/blob/v3.8.0/packages/material-renderers/src/layouts/MaterialCategorizationStepperLayout.tsx)) |
| Branching routes | `routes` on a step ([guide](/guide/steps#route-between-branches)) | Not in the [docs](https://jsonforms.io/docs/) |
| Conditional fields | `show` and `showAny` with `eq`, `neq`, `in`, `notIn`, `contains`, `notContains`, `notEmpty`, `gt`, `gte`, `lt`, `lte` ([guide](/guide/conditions)) | Rules with `SHOW`, `HIDE`, `ENABLE`, `DISABLE`; the condition is a JSON Schema checked against a `scope` ([rules](https://jsonforms.io/docs/uischema/rules)) |
| Repeatable items | Groups, which do not nest ([guide](/guide/groups)) | Arrays and nested objects from the schema ([controls](https://jsonforms.io/docs/uischema/controls)) |
| Validation | Declarative rules, named validators, async step validation, `validateSubmission()` on the server ([guide](/guide/validation)) | JSON Schema through AJV, `additionalErrors` from the backend ([validation](https://jsonforms.io/docs/validation)) |
| Submit | Built-in actions and `onSubmit` | No submit button; read `data` and `errors` in `onChange` ([React](https://jsonforms.io/docs/integrations/react)) |
| Custom components | `components` map per field type, headless renderer, `useFormEngine` ([guide](/guide/custom-components)) | Custom renderers picked by testers ([tutorial](https://jsonforms.io/docs/tutorial/custom-renderers)) |
| Frameworks | React 18 and 19, Vue 3.3.3+, framework-agnostic engine | React 16.12 to 19 ([peers](https://github.com/eclipsesource/jsonforms/blob/v3.8.0/packages/react/package.json)), Angular 20 to 22 ([peers](https://github.com/eclipsesource/jsonforms/blob/v3.8.0/packages/angular/package.json)), Vue 3.5+ ([peers](https://github.com/eclipsesource/jsonforms/blob/v3.8.0/packages/vue/package.json)) |
| Renderer sets | Built-in fields, or your own components | React Material, React Vanilla, Angular Material, Vue Vanilla, Vue Vuetify in preview ([renderer sets](https://jsonforms.io/docs/renderer-sets)) |
| i18n | Message and label catalogs, translation keys ([guide](/guide/translations)) | `translate` function and keys derived from the property path ([i18n](https://jsonforms.io/docs/i18n)) |
| Figma | Plugin draws the definition ([guide](/guide/figma)) | Not documented |
| AI tooling | JSON Schema, [MCP server](/guide/mcp), Claude Code plugin | Input is standard JSON Schema; no AI tooling documented |
| Bundle size (gzipped) | <!-- size:react:start -->34.6 KB<!-- size:react:end --> core + React | <!-- size:jsonforms:start -->82.6 KB for `@jsonforms/core` + `@jsonforms/react` + `@jsonforms/vanilla-renderers` 3.8.0<!-- size:jsonforms:end --> ([how it's measured](/guide/bundle-size)) |
| License | MIT | MIT ([license](https://github.com/eclipsesource/jsonforms/blob/v3.8.0/LICENSE)) |

In JSON Forms 3.8.0, AJV and lodash are two thirds of the minified bundle.

## Migration

The same sign-up form: email, plan, and a company field only for the Team plan.

### JSON Forms

```tsx
import { JsonForms } from '@jsonforms/react';
import { vanillaCells, vanillaRenderers } from '@jsonforms/vanilla-renderers';
import { useState } from 'react';

const schema = {
  type: 'object',
  properties: {
    email: { type: 'string', format: 'email' },
    plan: { type: 'string', enum: ['solo', 'team'] },
    company: { type: 'string' },
  },
  required: ['email', 'plan'],
  if: { properties: { plan: { const: 'team' } } },
  then: { required: ['company'] },
};

const uischema = {
  type: 'VerticalLayout',
  elements: [
    { type: 'Control', scope: '#/properties/email', label: 'Email' },
    { type: 'Control', scope: '#/properties/plan', label: 'Plan' },
    {
      type: 'Control',
      scope: '#/properties/company',
      label: 'Company',
      rule: { effect: 'SHOW', condition: { scope: '#/properties/plan', schema: { const: 'team' } } },
    },
  ],
};

export function Signup({ onDone }: { onDone: (values: Record<string, unknown>) => void }) {
  const [data, setData] = useState({});
  const [errors, setErrors] = useState<unknown[]>([]);

  return (
    <>
      <JsonForms
        schema={schema}
        uischema={uischema}
        data={data}
        renderers={vanillaRenderers}
        cells={vanillaCells}
        onChange={({ data, errors }) => {
          setData(data);
          setErrors(errors ?? []);
        }}
      />
      <button type="button" disabled={errors.length > 0} onClick={() => onDone(data)}>
        Create account
      </button>
    </>
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

The schema and the UI schema become one `fields` list. `required` moves into each field's `validation`. The `if`/`then` block and the `SHOW` rule become one `show` condition on `company`. The submit button and the error check are built in. Arrays of objects become a [group](/guide/groups). Arrays nested inside them have no Formhaus equivalent; keep those forms on JSON Forms.

## Related

- [Compare overview](/compare/)
- [Formhaus vs react-jsonschema-form](/compare/react-jsonschema-form)
- [Multi-step with branching recipe](/recipes/multi-step-branching)

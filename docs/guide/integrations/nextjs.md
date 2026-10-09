---
title: "Next.js App Router integration"
description: "Use Formhaus with the Next.js App Router: load the JSON definition in a server component, render it in a client component, re-validate in a route handler."
---

# Next.js App Router

A server component loads the definition, a client component renders it with `@formhaus/react`, and a route handler validates the submitted values again with `FormEngine` from `@formhaus/core`.

[Open in StackBlitz](https://stackblitz.com/github/ignsm/formhaus/tree/main/examples/nextjs-app-router) · [Source](https://github.com/ignsm/formhaus/tree/main/examples/nextjs-app-router)

## Install

```bash
npm install @formhaus/core @formhaus/react
```

## Definition

The Team plan routes to company details, the Personal plan to a name step. Both branches end at the confirm step.

<<< @/../examples/nextjs-app-router/form/definition.json

The definition module casts the JSON import to `FormDefinition` so the page and the route handler share one typed object:

<<< @/../examples/nextjs-app-router/form/definition.ts

## Server component

`page.tsx` has no `'use client'` directive. The definition is serialized into the client component's props.

<<< @/../examples/nextjs-app-router/app/page.tsx

Import `@formhaus/core/style.css` in the root layout for the default field styles:

<<< @/../examples/nextjs-app-router/app/layout.tsx

## Client component

`FormRenderer` uses React state, so it runs in a client component. `onSubmit` posts the values to the route handler. A `422` response carries field errors, which go to the `errors` prop. A `400` response carries a `message`, shown above the form.

<<< @/../examples/nextjs-app-router/app/signup-form.tsx

## Route handler

<<< @/../examples/nextjs-app-router/app/api/submit/route.ts

## How server re-validation works

- `parseValues` rejects a body that is not an object of string, number, boolean or string array values. The route handler returns `400` with a `message`, and the page shows it above the form.
- The route handler builds a new `FormEngine` from the same definition and the posted values.
- The engine computes the active path from the values. Fields on skipped branches are not validated: a Personal submission is not checked for `company`.
- `validate()` checks every visible field on the active path and returns `{ [fieldKey]: message }`.
- `getSubmitValues()` drops values that are not on the active path, so a client cannot send `company` with the Personal plan.
- When `FormRenderer` receives errors through the `errors` prop, it moves to the first step with an error and shows the messages there.

The `companyAvailable` validator is passed only on the server. The client has no validator with that name, so the rule is skipped in the browser and enforced in the route handler:

<<< @/../examples/nextjs-app-router/form/validators.ts

The type guard:

<<< @/../examples/nextjs-app-router/form/parse-values.ts

`FormEngine` does not coerce types: `"5"` sent for a number field is validated as a string. The route handler does not limit the request body size; set a limit in your proxy or hosting platform.

Choose the Team plan and enter `Acme` as the company to see the server error on the company step.

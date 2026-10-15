---
title: "Next.js App Router integration"
description: "Use Formhaus with the Next.js App Router: load the definition in a server component, render it on the client, validate submissions in a route handler."
---

# Next.js App Router

A server component loads the definition, a client component renders it with `@formhaus/react`, and a route handler validates the submission with `validateSubmission` from `@formhaus/core/server`.

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

`FormRenderer` uses React state, so it runs in a client component. `onSubmit` posts the values and skipped step ids to the route handler. A `422` response carries field errors, which go to the `errors` prop.

<<< @/../examples/nextjs-app-router/app/signup-form.tsx

## Route handler

<<< @/../examples/nextjs-app-router/app/api/submit/route.ts

## How server validation works

- The client posts `{ values, skippedSteps }`. `skippedSteps` comes from the second argument of the submit handler.
- `validateSubmission()` from `@formhaus/core/server` computes the active path from the values. Fields on hidden steps, hidden fields and skipped steps are not validated and not returned.
- It drops unknown keys, checks value types, `options` and the `email`, `date`, `datetime` and `time` formats, then runs the definition rules.
- It returns `{ values, errors }`. A non-empty `errors` becomes a `422`.
- When `FormRenderer` receives errors through the `errors` prop, it moves to the first step with an error and shows the messages there.

`validateSubmission()` ignores named validators. The route handler runs them on the returned values. The client has no `companyAvailable` validator, so the rule is skipped in the browser and enforced on the server:

<<< @/../examples/nextjs-app-router/form/validators.ts

The route handler does not limit the request body size; set a limit in your proxy or hosting platform. See [Server-side validation](/guide/server-validation) for the full list of checks.

Choose the Team plan and enter `Acme` as the company to see the server error on the company step.

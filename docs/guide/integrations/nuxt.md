---
title: "Nuxt integration"
description: "Use Formhaus with Nuxt: render a JSON form definition on a page with @formhaus/vue and validate the submission in a Nitro server route with validateSubmission."
---

# Nuxt

A Nuxt page renders the definition with `@formhaus/vue`, and a server route validates the submission with `validateSubmission` from `@formhaus/core/server`.

[Open in StackBlitz](https://stackblitz.com/github/ignsm/formhaus/tree/main/examples/nuxt) · [Source](https://github.com/ignsm/formhaus/tree/main/examples/nuxt)

## Install

```bash
npm install @formhaus/core @formhaus/vue
```

Add the default field styles in `nuxt.config.ts`:

<<< @/../examples/nuxt/nuxt.config.ts

## Definition

The definition lives in `shared/`, so the page and the server route import the same file. The Team plan routes to company details, the Personal plan to a name step.

<<< @/../examples/nuxt/shared/definition.json

<<< @/../examples/nuxt/shared/definition.ts

## Page

The awaited `@submit` handler keeps the form in its loading state until the request finishes. `ignoreResponseError` makes `$fetch` return the `422` body instead of throwing. Field errors go to the `errors` prop.

<<< @/../examples/nuxt/app/pages/index.vue

## Server route

<<< @/../examples/nuxt/server/api/submit.post.ts

## How server validation works

- The client posts `{ values, skippedSteps }`. `skippedSteps` comes from the second argument of the submit handler.
- `validateSubmission()` from `@formhaus/core/server` computes the active path from the values. Fields on hidden steps, hidden fields and skipped steps are not validated and not returned.
- It drops unknown keys, checks value types, `options` and the `email`, `date` and `datetime` formats, then runs the definition rules.
- It returns `{ values, errors }`. A non-empty `errors` becomes a `422`.
- When `FormRenderer` receives errors through the `errors` prop, it moves to the first step with an error and shows the messages there.

`validateSubmission()` ignores named validators. The server route runs them on the returned values. The client has no `companyAvailable` validator, so the rule is skipped in the browser and enforced on the server:

<<< @/../examples/nuxt/server/validators.ts

The server route does not limit the request body size; set a limit in your proxy or hosting platform. See [Server-side validation](/guide/server-validation) for the full list of checks.

Choose the Team plan and enter `Acme` as the company to see the server error on the company step.

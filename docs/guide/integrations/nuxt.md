---
title: "Nuxt integration"
description: "Use Formhaus with Nuxt: render a JSON form definition on a page with @formhaus/vue and re-validate the submission in a Nitro server route with FormEngine."
---

# Nuxt

A Nuxt page renders the definition with `@formhaus/vue`, and a server route validates the submitted values again with `FormEngine` from `@formhaus/core`.

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

`submitHandler` keeps the form in its loading state until the request finishes. `ignoreResponseError` makes `$fetch` return the `400` and `422` bodies instead of throwing. Field errors go to the `errors` prop, and a `message` is shown above the form.

<<< @/../examples/nuxt/app/pages/index.vue

## Server route

<<< @/../examples/nuxt/server/api/submit.post.ts

## How server re-validation works

- `parseValues` rejects a body that is not an object of string, number, boolean or string array values. The server route returns `400` with a `message`, and the page shows it above the form.
- The server route builds a new `FormEngine` from the same definition and the posted values.
- The engine computes the active path from the values. Fields on skipped branches are not validated: a Personal submission is not checked for `company`.
- `validate()` checks every visible field on the active path and returns `{ [fieldKey]: message }`.
- `getSubmitValues()` drops values that are not on the active path.
- When `FormRenderer` receives errors through the `errors` prop, it moves to the first step with an error and shows the messages there.

The `companyAvailable` validator is passed only on the server, so the rule is skipped in the browser and enforced in the server route:

<<< @/../examples/nuxt/server/validators.ts

The type guard:

<<< @/../examples/nuxt/server/parse-values.ts

`FormEngine` does not coerce types: `"5"` sent for a number field is validated as a string. The server route does not limit the request body size; set a limit in your proxy or hosting platform.

Choose the Team plan and enter `Acme` as the company to see the server error on the company step.

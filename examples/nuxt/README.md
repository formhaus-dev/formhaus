# Nuxt example

A Nuxt page renders the form with `@formhaus/vue`, and a server route validates the submission with `validateSubmission` from `@formhaus/core/server`.

[Open in StackBlitz](https://stackblitz.com/github/ignsm/formhaus/tree/main/examples/nuxt)

## Run

This example is its own pnpm workspace and installs `@formhaus/*` from npm:

```bash
pnpm install
pnpm dev
```

Opens at http://localhost:3000. Choose the Team plan and enter `Acme` as the company to see a server-side error.

## Files

- [shared/definition.json](shared/definition.json) is a branching form: the Team plan routes to company details, the Personal plan to a name step. The page and the server route import the same file.
- [app/pages/index.vue](app/pages/index.vue) posts values and skipped steps with `$fetch` from the awaited `@submit` handler and passes returned errors to `FormRenderer`.
- [server/api/submit.post.ts](server/api/submit.post.ts) runs `validateSubmission()` on the posted values and skipped steps and returns `422` with field errors.
- [server/validators.ts](server/validators.ts) holds the server-only `companyAvailable` validator. `validateSubmission()` ignores named validators, so the server route runs it on the returned values.

The server route does not limit the request body size; set a limit in your proxy or hosting platform.

## Use as a starter

Copy the folder, replace `definition.json`, and save the `values` returned by `validateSubmission()` in the server route.

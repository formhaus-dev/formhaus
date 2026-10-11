# Next.js App Router example

A server component loads the definition, a client component renders it with `@formhaus/react`, and a route handler validates the submission with `validateSubmission` from `@formhaus/core/server`.

[Open in StackBlitz](https://stackblitz.com/github/ignsm/formhaus/tree/main/examples/nextjs-app-router)

## Run

This example is its own pnpm workspace and installs `@formhaus/*` from npm:

```bash
pnpm install
pnpm dev
```

Opens at http://localhost:3000. Choose the Team plan and enter `Acme` as the company to see a server-side error.

## Files

- [form/definition.json](form/definition.json) is a branching form: the Team plan routes to company details, the Personal plan to a name step.
- [app/page.tsx](app/page.tsx) is a server component that passes the definition to the client form.
- [app/signup-form.tsx](app/signup-form.tsx) posts values and skipped steps to the route handler and passes returned errors to `FormRenderer`.
- [app/api/submit/route.ts](app/api/submit/route.ts) runs `validateSubmission()` on the posted values and skipped steps and returns `422` with field errors.
- [form/validators.ts](form/validators.ts) holds the server-only `companyAvailable` validator. `validateSubmission()` ignores named validators, so the route handler runs it on the returned values.

The route handler does not limit the request body size; set a limit in your proxy or hosting platform.

## Use as a starter

Copy the folder, replace `definition.json`, and save the `values` returned by `validateSubmission()` in the route handler.

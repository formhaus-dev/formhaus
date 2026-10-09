# Next.js App Router example

A server component loads the definition, a client component renders it with `@formhaus/react`, and a route handler validates the submission again with `FormEngine`.

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
- [app/signup-form.tsx](app/signup-form.tsx) posts values to the route handler and passes returned errors to `FormRenderer`.
- [app/api/submit/route.ts](app/api/submit/route.ts) runs `FormEngine.validate()` on the posted values and returns `422` with field errors.
- [form/validators.ts](form/validators.ts) holds the server-only `companyAvailable` validator.
- [form/parse-values.ts](form/parse-values.ts) rejects bodies that are not an object of string, number, boolean or string array values with `400`.

`FormEngine` does not coerce types: `"5"` sent for a number field is validated as a string. The route handler does not limit the request body size; set a limit in your proxy or hosting platform.

## Use as a starter

Copy the folder, replace `definition.json`, and save `engine.getSubmitValues()` in the route handler.

# Multi-step form with a flat API

A three-step account form that sends one flat request to an existing API. The API uses snake_case keys and answers `422` with errors keyed by its own field names. The adapter maps keys both ways and returns a submit result, so the form opens the earliest step with an error, keeps every answer, and runs `onAfterSubmit` only after a successful save.

## Run

Build the local packages first (see [Dependencies](#dependencies)), then:

```bash
pnpm install
pnpm dev
```

Opens at http://localhost:5173. The mock API rejects:

- a first name with digits (step 1)
- `taken@example.com` (step 1)
- an email at `@blocked.example`, under a key the form does not have (shown above the buttons)
- a company name with "test" (step 2, business accounts only)
- a postcode that starts with `0` (step 3)

The "Force a response" toggles make the server reject a field whatever its value, answer with a key the form does not have, or fail with a general error. Fill the form normally, tick a toggle for step 1 and submit from step 3 to watch the form jump back. "Network down" makes the request throw before it reaches the server.

## Files

- [src/account.json](src/account.json) is the definition. It is the same form as the `flat-api-steps` case in the shared conformance corpus.
- [src/api.ts](src/api.ts) is a deterministic in-memory API. Replace it with your HTTP client.
- [src/adapter.ts](src/adapter.ts) maps `firstName` to `first_name` on the way out, maps error keys back, and turns the response into a `SubmitResult`.
- [src/App.tsx](src/App.tsx) renders the form and shows the last request.

## Dependencies

Until `@formhaus/core` and `@formhaus/react` publish submit results, this example installs them from `packages/` in this repository. Build them first:

```bash
pnpm --dir ../.. install
pnpm --dir ../.. --filter @formhaus/core --filter @formhaus/react run build
```

After the release it will install from npm like the other examples.

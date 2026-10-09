# React quiz funnel example

A five-step plan quiz: answers advance on click, a route splits solo and team visitors, the lead is saved when the visitor leaves the contact step, and every funnel event is logged next to the form.

## Run

This example installs its own dependencies (it ignores the workspace root):

```bash
pnpm install --ignore-workspace
pnpm dev
```

Opens at http://localhost:5173. Enter an email that starts with `fail@` to see a failed lead save.

## Files

- [src/quiz.json](src/quiz.json) is the definition: `autoAdvance` radios with `next: false`, `routes` from the first step, and an explicit `routes` entry where the team branch rejoins.
- [src/App.tsx](src/App.tsx) saves the lead in `onBeforeStepChange` and updates it in `onSubmit` with the same id, so going back and forth never creates a second lead.
- [src/plan.ts](src/plan.ts) picks the recommended plan from the answers.
- [src/api.ts](src/api.ts) is an in-memory stand-in for your lead API.
- [src/EventLog.tsx](src/EventLog.tsx) prints `onAnalyticsEvent` output.

## Use as a starter

Copy the folder, replace `api.ts` with calls to your backend, and edit `quiz.json`.

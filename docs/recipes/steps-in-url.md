---
title: "Form steps in the URL with Next.js or Vue Router"
description: "Sync Formhaus steps with the URL: push history on step_viewed, open steps on Back, Forward and deep links with goToStep, and show a notice on a redirect."
---

# How do I put the current step in the URL?

Write the step id to the URL on `step_viewed`. On browser Back, Forward and on page load, pass the id from the URL to `goToStep()`. If the step can't be opened, the form opens the previous available step and reports it: `goToStep()` returns `{ reached: false, reason }` and the engine reports `step_redirected`. A visitor can't skip validation or branching through the URL.

## React and Next.js App Router

The component keeps the step in the URL hash with `history.pushState`. The App Router supports `pushState` and `replaceState` since Next.js 14.1, so no router import is needed. Save as `steps-in-url.tsx`:

<<< @/recipes/snippets/steps-in-url.tsx

Render it from a page:

<<< @/recipes/snippets/steps-in-url-page.tsx

## Vue Router

The component keeps the step in the `step` query parameter:

<<< @/recipes/snippets/steps-in-url.vue

## Notes

- `goToStep()` returns `reason: 'blocked'` for a step behind an invalid step, `'not-on-path'` for a step that a branch leaves out and `'unknown-step'` for an id the form does not have. See [Opening a step by id](/spec#opening-a-step-by-id).
- The listeners skip `step_viewed` while `goToStep()` runs, so Back and Forward do not add history entries.
- A reload starts with empty answers, so a deep link to a later step opens the first step. Keep answers with `initialValues` or the [Cloud draft](/guide/endpoint#drafts) to restore the step too.

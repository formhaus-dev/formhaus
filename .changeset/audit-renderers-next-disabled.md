---
'@formhaus/react': patch
'@formhaus/vue': patch
---

- Continue is disabled while the `disabled` conditions of the step `next` action match. Enter does not advance the step either.
- Custom actions components receive the `next` action of the current step as `nextAction`.

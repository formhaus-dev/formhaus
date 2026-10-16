---
"@formhaus/core": minor
---

- New `createChallengeFrame()` in `@formhaus/core/cloud` runs the Formhaus Cloud bot check in a frame from `formhaus.cc` and returns a token.
- Submitters from `createSubmitter()` take the bot check token as a third argument.
- `PublishedForm` has `challenge` when the form requires a bot check.
- New messages for the `verification_failed` and `verification_required` errors and for a bot check that does not load.

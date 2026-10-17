---
"@formhaus/core": minor
---

- New `createChallengeFrame()` in `@formhaus/core/cloud` runs the Formhaus Cloud bot check in a frame from `formhaus.cc` and returns a token. It resolves without a token when the frame cannot load.
- Submitters from `createSubmitter()` take the bot check token as a third argument.
- `PublishedForm` has `challenge` when Formhaus Cloud has the bot check on.
- New messages for the `verification_failed` and `verification_required` errors and for a bot check that takes too long.
- `style.css` applies the theme tokens and dark theme to `.fh-cloud`. With `FormhausForm`, set theme tokens on `.fh-cloud`.

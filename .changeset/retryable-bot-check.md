---
"@formhaus/core": patch
"@formhaus/react": patch
"@formhaus/vue": patch
---

- `verification_failed` and `verification_timeout` errors now have `action: 'retry'` and `retryable: true`, to match their message. `FormhausForm` shows a "Try again" button for them that runs the bot check again.

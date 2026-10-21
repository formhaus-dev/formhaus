---
"@formhaus/core": minor
"@formhaus/react": minor
"@formhaus/vue": minor
---

- `FormhausForm` loads the bot check as soon as the form shows instead of on first focus.
- New `challengeWait` option on `CloudSubmitOptions` sends the milliseconds a submission waited for the bot check. `FormhausForm` sets it.
- The primary button shows a spinner when it stays busy for more than 800 ms, and no longer fades while busy. With reduced motion the spinner does not turn.

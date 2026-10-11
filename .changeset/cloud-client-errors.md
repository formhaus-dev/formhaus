---
"@formhaus/core": patch
---

- A paused form loaded from `@formhaus/core/cloud` fails with code `"paused"` and "This form is paused." instead of "Could not send. Try again."
- Cloud requests time out after 15 seconds for the definition and 30 seconds for a submission. The `CloudError` has `status` `0`, code `"timeout"` and the `"retry"` action.
- The network failure message is "Could not reach the form server. Check your connection and try again." instead of "You are offline".
- A response body that is not JSON fails with a `CloudError` with code `"invalid_response"` instead of a `SyntaxError`.
- `start()` of `createCloudController()` loads the definition again after a load error.

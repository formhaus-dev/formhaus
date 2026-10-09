---
"@formhaus/react": patch
"@formhaus/vue": patch
---

- A failed navigation or submit error clears when the user retries or the definition changes, instead of staying on the next step.
- A failed action no longer replaces field or external errors. Its message shows next to the form-level errors and is not added to `engine.topLevelErrors`.

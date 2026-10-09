---
"@formhaus/core": patch
---

- `required` on checkbox and switch fields rejects `false`, so a required box must be checked.
- Changing an earlier answer that shows or hides another step no longer moves the user off the current step.
- A `matchField` error clears once the referenced field makes the values match.
- Errors on fields that leave the active route path are cleared.
- New `shouldApplyExternalErrors()` helper for custom renderers.

---
"@formhaus/core": patch
"@formhaus/react": patch
"@formhaus/vue": patch
---

- Fixed `subscribeValues` listeners missing a cleared hidden value with `hiddenValues: 'keep'` when `engine.values` had not been read yet.
- Fixed the React `FormActions` throwing when `testIds` is `null`.
- A Vue custom field component gets `testId` and `optionTestId` only when it declares them as props. Other components no longer render `test-id` and `option-test-id` attributes.

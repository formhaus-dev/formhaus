---
"@formhaus/core": minor
"@formhaus/react": minor
"@formhaus/vue": minor
---

Add cancellable async navigation and submission hooks, `prevStepAsync()` and `submitAsync()`.
Add radio `autoAdvance` on explicit activation and `next: false` to hide a step's Next button.
Keep keyboard arrow selection within the radio group and focus the destination after navigation.
Report failed after-hooks as committed actions with `FormLifecycleError`.
Vue: pressing Enter inside a form now runs the primary action, matching React.

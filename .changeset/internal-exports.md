---
"@formhaus/core": minor
---

- New `@formhaus/core/internal` entry for renderer plumbing. It has no semver guarantee.
- **Breaking:** `shouldApplyExternalErrors` is no longer exported from `@formhaus/core`. Import it from `@formhaus/core/internal`.
- **Breaking:** `createCloudController`, `initialCloudState` and `focusProblem` are no longer exported from `@formhaus/core/cloud`. Import them from `@formhaus/core/internal`, or use `FormhausForm` from `@formhaus/react/cloud` or `@formhaus/vue/cloud`.
- **Breaking:** the `CloudCallbacks` and `CloudState` types moved from `@formhaus/core/cloud` to `@formhaus/core/internal`. Import them from there.
- **Breaking:** the `form_abandoned` event is removed from `FormAnalyticsEvent`. It was never emitted. Remove handlers for it.

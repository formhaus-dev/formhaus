---
"@formhaus/react": minor
---

- Upgrade guide: [Migrate to 0.22](https://formhaus.dev/migrate/0.22).
- **Breaking:** `onAnalyticsEvent` is removed. Use `onFormEvent`.
- **Breaking:** `onPrev` in `FormActionsProps` is renamed to `onBack`.
- **Breaking:** `ItemComponent` in `GroupComponentProps` is renamed to `itemComponent`.
- **Breaking:** `useLocalizedForm(definition, source)` no longer takes `deps`. It rebuilds the form when `translate` changes, so keep `translate` stable with `useCallback`.
- The renderer handle has a `values` property with the current values.

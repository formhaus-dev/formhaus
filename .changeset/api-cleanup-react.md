---
"@formhaus/react": minor
---

- Upgrade guide: [Migrate to 0.22](https://formhaus.dev/migrate/0.22).
- **Breaking:** `onAnalyticsEvent` is removed. Use `onFormEvent`.
- **Breaking:** `onPrev` in `FormActionsProps` is renamed to `onBack`.
- **Breaking:** `ItemComponent` in `GroupComponentProps` is renamed to `itemComponent`.
- **Breaking:** `useLocalizedForm(definition, source, { key })` replaces the `deps` argument. A new `translate` function no longer rebuilds the form; the definition, `lang`, `prefix`, the overlay or `key` do.
- New `LocalizedFormOptions` type.
- The renderer handle has a `values` property with the current values and `goToStep()`.

---
"@formhaus/vue": minor
---

- Upgrade guide: [Migrate to 0.22](https://formhaus.dev/migrate/0.22).
- **Breaking:** `submitHandler` is removed. Use `@submit`.
- **Breaking:** `@analytics-event` is removed from `FormRenderer`, `HeadlessFormRenderer` and `FormhausForm`. Use `@form-event`.
- **Breaking:** `FormFieldProps` is renamed to `FieldComponentProps`.
- **Breaking:** `formFieldProps` and `formFieldEmits` are renamed to `fieldComponentProps` and `fieldComponentEmits`.
- **Breaking:** a custom actions component emits `back` instead of `prev`.
- `FormRendererHandle` is the `@formhaus/core` type, which now has `values`.
- The `success` event of `FormhausForm` is typed as `CloudSubmission` and includes `ending`.
- `FormhausForm` asks before removing a group item with answers, like `FormRenderer`.

---
"@formhaus/core": minor
"@formhaus/react": minor
"@formhaus/vue": minor
---

- New `noticeComponent` prop on the React `FormhausForm` and `notice` slot on the Vue one replace the error notice. Both get `notice` and `onAction`.
- New `noticePlacement` prop on `FormhausForm`, `'top'` (default) or `'actions'`. With `'actions'` the notice shows just above the buttons.
- A custom `actionsComponent` of `FormhausForm` receives the notice. In React it gets `notice` and `onNoticeAction`. In Vue it gets `notice` and emits `noticeAction` when it declares a `notice` prop.
- After a failed submission, `FormhausForm` focuses the first element with `data-fh-notice`, else the error summary or the first invalid field.
- New `code` property on `CloudNotice`: a known `CloudError` code, or `form_refreshed` after a new form version loads.
- New `cloudLabels` prop on `FormhausForm` translates the notices by code and the `retry`, `reload`, `submitted` and `submitAnother` texts. It takes a catalog or a function.
- New `CloudNoticeCode`, `CloudNoticeActionFn`, `CloudLabelKey`, `CloudLabelSource`, `FormhausFormActionsProps` and `FormhausFormNoticeProps` types.
- Fixed `FormhausForm` dropping errors thrown by its step and submit hooks before they reached `onError`.

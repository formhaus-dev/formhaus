---
"@formhaus/core": minor
---

- New `@formhaus/core/fields` entry with helpers for custom field components: `fieldState`, `fieldId`, `fieldAria`, `fieldValue`, `numberValue`, `inputType`, `optionChecked`, `fromDate`, `toDate`, `scaleView`, `optionText`, `optionValue` and `toggleOption`. `toDate` reads every date, datetime and time value core accepts and gives `null` for an impossible date such as `2026-02-31`. The main entry does not change.
- `SectionView` has `columns`, `FormActionsView` has `primaryDisabled`, `FormStepProgressView` has `stepErrorsLabel` and `FormStepStatus` has `errorsLabel`.

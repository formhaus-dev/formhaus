# React + Ant Design example

Maps every Formhaus field type and layout slot to Ant Design 6 components.

```bash
pnpm install
pnpm dev
```

## Files

- [src/component-map.ts](src/component-map.ts) lists the field and layout mappings.
- [src/fields/FieldItem.tsx](src/fields/FieldItem.tsx) wraps controls in `Form.Item` for label, help and `validateStatus`.
- [src/fields/ChoiceFields.tsx](src/fields/ChoiceFields.tsx): `Select`, `Radio.Group`, `Checkbox`, `Switch`, `Rate`, and a button `Radio.Group` for `scale`.
- [src/fields/PickerFields.tsx](src/fields/PickerFields.tsx): `DatePicker` and `TimePicker` with Formhaus string values (`YYYY-MM-DD`, `HH:mm`, `YYYY-MM-DDTHH:mm`), `Upload` for files.
- [src/layout/Feedback.tsx](src/layout/Feedback.tsx): `Steps` progress and `Alert` error summary.
- [src/layout/Containers.tsx](src/layout/Containers.tsx): actions, matrix sections, groups as `Card`, confirm dialog as `Modal`.

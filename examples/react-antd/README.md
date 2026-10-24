# React + Ant Design example

Maps every Formhaus field type and layout slot to Ant Design 6 components.

```bash
pnpm install
pnpm dev
```

## Files

- [src/component-map.tsx](src/component-map.tsx) maps field types to Ant Design controls with `mapControls`, one line per type, and lists the layout slots.
- [src/fields/Shell.tsx](src/fields/Shell.tsx) wraps each control in `Form.Item` for label, help and `validateStatus`, and choice groups in a `<fieldset>`.
- [src/fields/MatrixRow.tsx](src/fields/MatrixRow.tsx) renders a matrix row with the same `Radio.Group` control as radio fields.
- [src/layout/Feedback.tsx](src/layout/Feedback.tsx): `Steps` progress and `Alert` error summary.
- [src/layout/Containers.tsx](src/layout/Containers.tsx): actions, matrix sections, groups as `Card`, confirm dialog as `Modal`.

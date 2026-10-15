---
'@formhaus/react': patch
---

- Fixed `FieldComponentMap` entries such as `text: ({ value, onChange }) => …` failing strict type checks with implicit `any` props. Field entries get `FieldComponentProps` again, and `section`, `group`, `groupItem` and `confirmDialog` get their own props.

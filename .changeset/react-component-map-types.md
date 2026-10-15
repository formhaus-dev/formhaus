---
'@formhaus/react': patch
---

- Fixed `FieldComponentMap` entries such as `text: ({ value, onChange }) => …` failing strict type checks with implicit `any` props.
- `FieldComponentMap` types the props of `section`, `group`, `groupItem` and `confirmDialog` entries.

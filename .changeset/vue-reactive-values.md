---
"@formhaus/vue": minor
---

- The renderer handle exposes a reactive `values`.
- Fixed `useFormEngine().values` not updating dependent computeds.
- `useFormEngine().values` is a frozen copy of the values. Mutating it throws in strict mode.

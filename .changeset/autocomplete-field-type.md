---
"@formhaus/core": minor
"@formhaus/react": minor
"@formhaus/vue": minor
---

Added `'autocomplete'` to `DefaultFieldType` for type-to-filter dropdowns. React and Vue ship an `AutocompleteField` that renders `<input>` + `<datalist>` (native browser filtering, SSR-safe). For richer pickers (MUI `Autocomplete`, Headless UI `Combobox`) plug in your own component via `components`.

Note: native `<datalist>` filters by `value`, not `label`, and does not enforce that the value is in the list. See the field types guide.

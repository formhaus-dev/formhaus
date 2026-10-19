---
"@formhaus/core": patch
"@formhaus/react": patch
"@formhaus/vue": patch
---

- Autocomplete options that share a label are listed as `Label (value)`, and picking one submits its own value. Texts that still repeat get a number, as in `Label (value) (2)`.
- `contains` and `notContains` check up to as many selected items as the field allows, so a list of more than 1000 valid options still matches.

---
"@formhaus/core": minor
---

- New `contains` and `notContains` condition operators test one item of an array value, such as a `multiselect` answer: `{ "field": "sourceOfWealth", "contains": "OTHER" }`. They work in `show`, `showAny`, routes and `disabled`.
- `contains` never matches a value that is not an array. `notContains` matches whenever `contains` does not, including before the question is answered.
- New warnings `contains-not-list` for `contains` or `notContains` on a field that does not hold a list, and `contains-not-in-options` for a value that is not one of the field's options.
- Format version 1.4. `checkDefinition()` warns with `outdated-format-version` about `contains` or `notContains` without `"formatVersion": "1.4"`. Core 0.19 and older reject these definitions.

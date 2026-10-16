---
"@formhaus/core": minor
---

- **Breaking:** A field shown again gets back its last value, including `''`, `null` and `false`.
- **Breaking:** A field that starts hidden gets its initial value or `defaultValue` when it is shown.
- **Breaking:** A group shown again gets back its last items, or else its initial items, instead of `defaultItems` new items.
- **Breaking:** An item in the initial values or in `reset(values)` gets the `defaultValue` of the item fields it leaves out.

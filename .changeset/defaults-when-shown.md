---
"@formhaus/core": minor
---

- **Breaking:** A field that starts hidden or is shown again gets its `defaultValue` or initial value back unless the user edited it.
- **Breaking:** An unedited group that is shown again gets its initial items back instead of `defaultItems` new items.
- **Breaking:** An item in the initial values or in `reset(values)` gets the `defaultValue` of the item fields it leaves out.

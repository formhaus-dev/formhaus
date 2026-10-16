---
"@formhaus/core": minor
---

- **Breaking:** A field that starts hidden or is shown again gets its `defaultValue` or initial value back unless the user edited it. A field the user edited still comes back empty.
- **Breaking:** An unedited group that is shown again gets its initial items back instead of `defaultItems` new items.

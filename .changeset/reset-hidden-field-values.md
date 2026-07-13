---
'@formhaus/core': patch
---

- `reset()` clears values for fields that the reset values hide, instead of keeping them until the next change.
- Construction clears initial values for fields that other initial values hide, matching `reset()`.

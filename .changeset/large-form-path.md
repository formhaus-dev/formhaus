---
'@formhaus/core': patch
---

- `setValue()`, `next()` and `back()` do less work on long multi-step forms. On a 50-step form with 970 fields an answer takes 0.2 ms instead of 0.5 ms.

---
"@formhaus/core": patch
---

- `checkDefinition()` reports `slow-pattern` for more overlapping repeats, including runs split by optional parts or groups.
- A pattern whose test throws now fails validation instead of passing.
- New `recall-untrusted-source` warning for a `{{key}}` token that recalls a `hidden` field with a `referrer` or `pageTitle` source.

---
'@formhaus/core': patch
---

- `validateSubmission()` handles invalid group cells in linear time.
- `checkDefinition()` warns about a `pattern` with nested quantifiers, such as `(a+)+`, with the new `slow-pattern` code.
- A value longer than 10,000 characters fails `pattern` without being matched.
- The `referrer` source drops the query string and hash.
- `checkDefinition()`, `validateSubmission()` and `suggestFixes()` report sections and groups nested too deep as `invalid-nesting` instead of overflowing the stack.

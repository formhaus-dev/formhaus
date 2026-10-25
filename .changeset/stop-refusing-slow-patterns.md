---
"@formhaus/core": patch
---

- `validateSubmission()` no longer refuses definitions with patterns that `checkDefinition()` reports as `slow-pattern`. It runs every pattern, on values up to 10,000 characters.
- `checkDefinition()` no longer warns with `slow-pattern` about a repeated group that starts with a separator class nothing else in the group matches, such as `[A-Za-z]+([ '-][A-Za-z]+)*` or `\w+(\s+\w+)*`, or about a fixed-length group repeated a few times, such as `#(?:[0-9a-f]{3}){1,2}`.
- `checkDefinition()` checks patterns with long Unicode character classes faster.

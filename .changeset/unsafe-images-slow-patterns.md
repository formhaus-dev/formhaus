---
"@formhaus/core": patch
"@formhaus/react": patch
"@formhaus/vue": patch
---

- Option images with a `javascript:`, `data:` (other than png, jpeg, webp or gif), `file:` or credential-bearing URL are not rendered.
- `checkDefinition()` reports `slow-pattern` for adjacent repeated parts that overlap, such as `\d*\d*x`.

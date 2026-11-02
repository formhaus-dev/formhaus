---
"@formhaus/core": minor
"@formhaus/react": minor
"@formhaus/vue": minor
"@formhaus/mcp": minor
---

- Format 1.9: a group may contain `hidden` fields. Below `"formatVersion": "1.9"` they stay an `invalid-nesting` error.
- A hidden item value comes from the item in the initial values or from `defaultValue`, moves and is removed with its item, and is submitted in it.
- Errors of hidden item fields are listed in `topLevelErrors` and left out of the error summary and step error counts.
- `checkDefinition()` reports `source-in-group` for a `source` on a hidden field in a group.
- An item that holds only hidden values no longer asks before Remove.
- `capabilities` in `@formhaus/mcp` describes hidden fields in groups.

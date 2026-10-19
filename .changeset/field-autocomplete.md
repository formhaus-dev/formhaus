---
"@formhaus/core": minor
"@formhaus/react": minor
"@formhaus/vue": minor
"@formhaus/mcp": minor
"formhaus": minor
---

- Format 1.5: a field takes `autocomplete`, an HTML autofill token such as `given-name`, `email` or `off`. It needs `"formatVersion": "1.5"`.
- React and Vue set the `autocomplete` attribute from it. Without it, the attribute is not set, except on the `autocomplete` field type, which sets `off`.
- `checkDefinition()` reports `unknown-autocomplete-token` and `autocomplete-not-applicable`, and `outdated-format-version` for `autocomplete` below format 1.5.
- A line break in a step or section `description` or in `helperText` shows as a line break. The text stays plain.
- `capabilities` in `@formhaus/mcp` describes `autocomplete` and line breaks.

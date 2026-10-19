---
"@formhaus/core": minor
"@formhaus/react": minor
"@formhaus/vue": minor
"@formhaus/mcp": minor
"formhaus": minor
---

- Format 1.5: `{{key}}` in a text shows the answer of an earlier field. It needs `"formatVersion": "1.5"`; below it the braces show as written.
- Tokens work in step and section `title` and `description`, field and group `label` and `helperText`, and `placeholder`. Inside a group item, a token also reads the item's own fields.
- A token shows an option label, a number, a date, text, file names, or the item count of a group. A checkbox or switch shows its label when on.
- A missing answer, a hidden field and an unknown key show nothing. The result is plain text.
- New `recallText()` resolves a text against `engine.getSubmitValues()`.
- `checkDefinition()` reports `unknown-recall-field` and `recall-forward-reference`, and `outdated-format-version` for a token below format 1.5.
- `translationIssues()` reports a translation that drops or adds a `{{key}}` token.
- `capabilities` in `@formhaus/mcp` describes answer recall.

---
"@formhaus/core": minor
"@formhaus/react": minor
"@formhaus/vue": minor
"@formhaus/mcp": minor
---

- Format 1.5: a `multiselect` option with `"exclusive": true` is the only answer when picked, as in "None of these".
- `setValue()` and `setItemValue()` clear the other answers when an exclusive option is picked, and clear exclusive options when another option is picked. Several exclusive options clear each other.
- A list with an exclusive option and any other value fails the type check in `validate()` and `validateSubmission()` with the `options` message.
- An exclusive option alone satisfies `required` and skips `minLength`.
- New label `or` (`or`), shown by the React and Vue renderers before exclusive options. `textSlots()` lists it for forms with exclusive options.
- `checkDefinition()` reports `exclusive-not-applicable`, `exclusive-option-position`, `exclusive-default-value` and `exclusive-with-min-length`, and `outdated-format-version` for an exclusive option below format 1.5.
- `capabilities` in `@formhaus/mcp` describes exclusive options.

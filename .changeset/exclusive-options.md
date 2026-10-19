---
"@formhaus/core": minor
"@formhaus/react": minor
"@formhaus/vue": minor
"@formhaus/mcp": minor
---

- Format 1.5: a `multiselect` option with `"exclusive": true` is the only answer when picked, as in "None of these".
- `setValue()` and `setItemValue()` clear the other answers when an exclusive option is picked, and clear exclusive options when another option is picked. Several exclusive options clear each other.
- A list with an exclusive option and any other value fails the type check in `validate()` and `validateSubmission()` with the new `exclusive` message, default `Select "{option}" or other options, not both`.
- An exclusive option alone satisfies `required` and skips `minLength`.
- New `or` label, default “or”, shown before exclusive options. `textSlots()` lists it and the `exclusive` message for forms with exclusive options.
- `checkDefinition()` reports `exclusive-not-applicable`, `exclusive-option-position`, `exclusive-default-value` and `exclusive-with-min-length`, and `outdated-format-version` for an exclusive option below format 1.5.
- `capabilities` in `@formhaus/mcp` describes exclusive options.

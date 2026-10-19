---
"@formhaus/core": minor
"@formhaus/react": minor
"@formhaus/vue": minor
---

- Recalled dates, times, numbers and lists are formatted for the locale with `Intl`. A stored date shows its own day in every time zone.
- New `formatRecall` option on the engine and the renderers replaces the formatting of recalled answers, including in the error summary.
- New `lang` option on the engine and the renderers. It wins over the definition `lang` for recalled answers, and both fall back to `en`.
- New `RecallFormatFn` and `RecallOptions` types.
- New `recallStatic()` replaces each recall token with the label of its field, the key for a field without a label, or an empty text for an unknown key. An optional group reads that group's item keys first.
- Group `itemLabel` recalls answers from its own item.
- Token keys may hold letters, digits, `_`, `-` and `.`. A token with any other content shows as written, and `checkDefinition()` reports `recall-syntax`.
- `\{{` shows literal braces.
- Recalled text in titles and labels shows runs of whitespace as one space.

---
"@formhaus/core": minor
"@formhaus/react": minor
"@formhaus/vue": minor
"@formhaus/mcp": minor
---

- Format 1.6: `"randomize": true` on a `radio`, `multiselect` or `select` field shows its options in a random order per respondent. Options with `"pinned": true` and exclusive options keep their written position.
- New `seed` engine option and renderer prop. The same seed shows the same order. `engine.seed` returns it.
- New `engine.orderOptions(key, options?)` returns the options of a field in shown order.
- The React and Vue renderers draw randomized options in shown order. Without `seed`, server rendering and hydration show the written order, and the shuffle applies after mount.
- `checkDefinition()` reports `randomize-not-applicable`, and `outdated-format-version` for `randomize` or `pinned` below format 1.6.
- `suggestFixes()` offers to remove `randomize` and `pinned` where they do not apply.
- `capabilities` in `@formhaus/mcp` describes `randomize` and `pinned`.

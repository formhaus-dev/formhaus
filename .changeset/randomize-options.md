---
"@formhaus/core": minor
"@formhaus/react": minor
"@formhaus/vue": minor
"@formhaus/mcp": minor
---

- Format 1.6: `"randomize": true` on a `radio`, `multiselect` or `select` field shows its options in a random order per respondent. Options with `"pinned": true` and exclusive options keep their written position.
- New `@formhaus/core/research` entry with option randomization. Pass its `research` object to apply the order. Without it, options show in written order, and development builds report `missing-research` once per page load through `onWarning`.
- New `research` and `seed` props on `FormRenderer`, `HeadlessFormRenderer` and `useFormEngine`, and engine options of the same names. The same seed shows the same order. `engine.seed` returns it.
- New `engine.orderOptions(key, options?)` returns the options of a field in shown order.
- Without `seed`, server rendering and hydration show the written order, and the shuffle applies after mount.
- `checkDefinition()` reports `randomize-not-applicable`, and `outdated-format-version` for `randomize` or `pinned` below format 1.6.
- `suggestFixes()` offers to remove `randomize` and `pinned` where they do not apply.
- `capabilities` in `@formhaus/mcp` describes `randomize`, `pinned` and the research module.

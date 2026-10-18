---
"@formhaus/mcp": minor
---

- `capabilities` lists the `scale` and `rating` field types, anchor options, picture options with `image`, matrix sections and empty steps for welcome screens.
- `example_definitions` adds `product-survey`: a welcome step, an NPS scale, a rating, picture choice and a matrix.
- `validate_definition` accepts `autoAdvance` on `scale` and `rating` and warns about it on matrix rows.
- New warnings: `scale-range`, `rating-min`, `anchor-out-of-range`, `too-many-anchors`, `matrix-options-mismatch`, `matrix-row-type`, `matrix-too-wide` and `image-not-applicable`.
- `simulate_path` moves past a `next: false` step once its `autoAdvance` scale or rating is answered.

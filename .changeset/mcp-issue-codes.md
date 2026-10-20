---
"@formhaus/mcp": patch
---

- `validate_definition` and `fix_definition` report the issue codes of `@formhaus/core` 0.22: `min-greater-than-max`, `default-items-greater-than-max`, `group-item-limit` and `invalid-columns` replace `invalid-range`, `missing-label` replaces `empty-label` and the `missing-property` issue for a `label`, and `i18n-key-without-text` replaces `i18n-unbound-slot`.
- A missing `label` is reported at the path of the `label` property, such as `/fields/0/label`.

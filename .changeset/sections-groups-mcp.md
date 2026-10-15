---
'@formhaus/mcp': minor
---

- `capabilities` describes sections and repeatable groups, their translation slots and the new `addItem`, `removeItem`, `itemLabel`, `itemAdded` and `itemRemoved` labels, and reports format 1.1.
- `validate_definition` reports the new `group-scope`, `invalid-nesting` and `outdated-format-version` issues, and warns about `autoAdvance` on a radio inside a group.
- `simulate_path` accepts group answers as arrays of item objects and lists item fields and their errors by path, such as `participants.0.email`.
- New `event-registration` example with a conditional section and a group of participants.

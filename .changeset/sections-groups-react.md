---
'@formhaus/react': minor
---

- Renders sections as a `fieldset` with a `legend` and repeatable groups with Add and Remove buttons and numbered item titles.
- Adding an item focuses its first field. Removing one focuses the next item title, or Add when no item follows. A polite live region announces both.
- The error summary links to item fields, and a group count error focuses its Add button.
- New `section`, `group`, `groupItem` and `confirmDialog` entries in `components` replace the markup of sections, groups, item cards and the remove dialog. `DefaultSection`, `DefaultGroup`, `DefaultGroupItem` and `DefaultConfirmDialog` are exported.
- Removing a group item with answers asks first in a modal dialog. Turn it off with `confirmRemove: false`.

---
'@formhaus/core': patch
---

- A missing required property is reported as `missing-property` with the path of the object that lacks it, such as `/: missing required property "id".` A present value of the wrong type is reported as `invalid-type`.
- `checkDefinition()` warns about unknown properties with the new `unknown-property` code and names the closest known property, such as `Did you mean "id"?`. The engine still ignores unknown properties.
- `checkDefinition()` warns about a missing step `title`, field or option `label`, or action `label`, and about an empty `label` on a visible field with the new `empty-label` code.

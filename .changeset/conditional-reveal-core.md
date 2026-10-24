---
"@formhaus/core": minor
---

- New `revealTargets(nodes)` returns, for each node of a list, the choice field and option that reveal it, following the new Revealed fields rule of the specification.
- Exposes the `RevealTarget` and `RevealView` types.
- `ControlOption` has `reveal`, and `controlOptions()` takes the revealed fields of the options as a third argument.
- `choiceControl()` ignores keys and clicks that come from a nested field when the event has `currentTarget`.
- New `.fh-field__reveal` style for fields shown under an option.
- The invalid border of option cards and the picture grid apply only to options that are direct children of the option group in the built-in markup.

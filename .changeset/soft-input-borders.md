---
"@formhaus/core": patch
---

- Input, scale box and option card borders are softer by default: `#b1b8c2` light and `#444b53` dark at rest, `#8e959f` light and `#5e656d` dark on hover.
- Under `prefers-contrast: more` these borders keep the higher-contrast values: `#84848d` light and `#73737d` dark at rest, `#5f5f68` light and `#9a9aa5` dark on hover.
- New `--fh-color-input-border-strong` and `--fh-color-input-border-strong-hover` custom properties hold the higher-contrast values.
- To always use the higher-contrast borders, set `--fh-color-input-border` and `--fh-color-input-border-hover`.

---
"@formhaus/core": patch
---

- New `--fh-color-input-border` and `--fh-color-input-border-hover` custom properties.
- Text inputs, textareas, selects, date, time and file fields, scale boxes and the switch track use `--fh-color-input-border` instead of `--fh-color-border`.
- The default input border is darker for WCAG 1.4.11 contrast: `#84848d` light and `#73737d` dark, 3.7:1 against the background. To restore the old look, set `--fh-color-input-border` to `#d4d4d8` (dark: `#3a3a41`) and `--fh-color-input-border-hover` to `#a1a1aa` (dark: `#5a5a63`).
- Under `prefers-contrast: more`, `--fh-color-border`, `--fh-color-border-hover` and `--fh-color-secondary-border` use the input border colors.
- The package ships the design tokens as DTCG JSON in `@formhaus/core/tokens/`, with light and dark, fine and coarse pointer, regular and compact width, and standard and increased contrast modes.

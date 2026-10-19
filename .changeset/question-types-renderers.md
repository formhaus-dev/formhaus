---
"@formhaus/react": minor
"@formhaus/vue": minor
---

- New `ScaleField` renders `scale` as numbered boxes and `rating` as stars, with native radios, anchor labels and digit-key selection.
- `scale` and `rating` support `autoAdvance`: a click, Space, Enter or a digit key moves to the next step.
- `RadioField` and `MultiselectField` show option images as a grid of picture cards, about 200px wide or `columns` per row.
- Each picture card has an Enlarge button that opens the image in a dialog. It comes after the option in Tab order. Its button names come from the `enlargeImage` and `close` labels.
- A picture card whose image fails to load shows a plain surface and no Enlarge button.
- `DefaultSection` draws a section with `layout: "matrix"` as a grid with a column header.

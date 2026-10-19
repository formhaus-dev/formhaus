---
"@formhaus/core": patch
"@formhaus/react": patch
"@formhaus/vue": patch
---

- `checkDefinition()`, the `FormEngine` constructor and `validateSubmission()` reject a `scale` or `rating` whose `min` or `max` is not an integer, or whose range has fewer than 2 or more than 11 points, with the new `invalid-scale` error. `rating` `max` must be 2 to 11.
- `checkDefinition()` warns with the new `unsafe-image-url` code about an option `image` that does not start with `https:` or `data:image/`.
- `ScaleField` draws at most 11 points.
- Option images and the enlarged preview load with `referrerpolicy="no-referrer"`.

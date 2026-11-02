---
"@formhaus/core": minor
---

- New `@formhaus/core/html` entry with `renderToStaticMarkup(definition, options)`. It returns a single-page form as an HTML string with the same markup and class names as the React and Vue renderers, and posts without JavaScript. It needs no DOM or Node API and throws for steps, groups and file fields.
- `parseFormData()` in `@formhaus/core/html` reads a post into typed values.
- New `@formhaus/core/html.iife.js` bundle that sets the global `FormhausHtml`.
- Option image sources are checked without the `URL` global and in linear time. A source with a user name is rejected, as before.

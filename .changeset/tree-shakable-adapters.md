---
"@formhaus/core": patch
"@formhaus/react": patch
"@formhaus/vue": patch
---

- Importing a single hook or component from `@formhaus/react` no longer pulls in the whole adapter. An app that uses only `useFormEngine` drops from 29.4 KB to 17.7 KB gzipped, and `@formhaus/vue` from 22.9 KB to 17.7 KB.
- The ES module files in `dist` are no longer minified. Bundlers minify them as before. `server.iife.js` stays minified.

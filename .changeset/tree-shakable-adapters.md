---
"@formhaus/core": patch
"@formhaus/react": patch
"@formhaus/vue": patch
---

- Importing a single hook or component from `@formhaus/react` no longer pulls in the whole adapter. An app that uses only `useFormEngine` drops from 30.1 KB to 18.1 KB gzipped, and `@formhaus/vue` from 23.5 KB to 18.1 KB.
- The ES module files in `dist` are no longer minified. Bundlers minify them as before. `server.iife.js` stays minified.

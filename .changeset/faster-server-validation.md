---
"@formhaus/core": patch
---

`validateSubmission()` checks the definition once per call, about 20% faster in the `server.iife.js` build and about 35% faster in Node outside production.

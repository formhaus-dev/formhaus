---
"@formhaus/core": patch
---

`validateSubmission()` checks the definition once per call instead of once per internal pass, so it runs faster in every build.

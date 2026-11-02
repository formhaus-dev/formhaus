---
"@formhaus/core": patch
"@formhaus/react": patch
"@formhaus/vue": patch
---

Field ids no longer collide with the helper, error, label, option or group button ids of another field. A field keyed `plan-helper` next to `plan` gets a short stable suffix; other ids stay the same.

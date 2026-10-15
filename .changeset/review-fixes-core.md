---
'@formhaus/core': patch
---

- Fixed a cancelled final Skip restoring old answers and server errors over a newer submission when its response arrived late.
- Fixed `stepErrors` for steps with ids such as `constructor` and `__proto__`. `stepErrors` is now an object without a prototype.

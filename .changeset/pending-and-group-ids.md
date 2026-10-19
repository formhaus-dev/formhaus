---
"@formhaus/core": patch
---

- `next()`, `back()`, `skip()` and `submit()` return `false` when a shown field that was empty at the start gets an answer while a hook is pending. Before, they went ahead with the values the hook saw. This includes answers written by the hook itself.
- Group items that are not objects get distinct ids when they are edited. Before, every such item had the id `0`, which gave duplicate list keys in React and Vue.

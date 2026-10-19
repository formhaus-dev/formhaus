---
"@formhaus/core": patch
---

- `next()`, `back()`, `skip()` and `submit()` return `false` when a shown field that was empty when a hook started gets a value while the hook is pending, for example when the respondent answers it. Before, they went ahead with the values the hook saw. Values written into empty `hidden` fields, such as captcha or lead tokens, do not cancel the action.
- Group items that are not objects get distinct ids when they are edited. Before, every such item had the id `0`, which gave duplicate list keys in React and Vue.

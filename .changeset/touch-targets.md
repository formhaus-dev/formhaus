---
"@formhaus/core": patch
---

- On touch screens the stylesheet uses 17px text and 15px helper and error text. Inputs stay at 16px or more, so iOS Safari does not zoom in on focus.
- The whole checkbox and switch row toggles the control. On touch screens the row is at least 44px tall.

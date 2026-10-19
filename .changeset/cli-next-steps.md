---
"formhaus": patch
---

- Setup output lists each agent on one line and ends with next steps: restart your agents, ask for a form, render it or publish it on Formhaus Cloud.
- A second run says `already set up` for each agent.
- New `--verbose` flag lists every file checked or changed and the `.bak` backups. File paths are hidden without it.
- Status symbols are colored only in a terminal. `NO_COLOR` turns color off.

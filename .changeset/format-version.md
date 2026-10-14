---
'@formhaus/core': patch
'@formhaus/mcp': patch
---

- Definitions can declare their format version with `formatVersion`. A core that does not support it reports `unsupported-format-version`.
- New `FORMAT_VERSION` export names the definition format this core reads.
- The MCP `capabilities` tool reports the supported definition format version.

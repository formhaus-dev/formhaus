---
"@formhaus/mcp": patch
---

- `get_submissions` keeps a `notice` sent by the API and appends the untrusted-data notice instead of replacing one with the other.
- The `agent_key` instructions say the server reads `FORMHAUS_API_KEY` from the env of the MCP client config, not from the project `.env`.
- `ajv` and `fast-uri` updated to versions without known advisories.

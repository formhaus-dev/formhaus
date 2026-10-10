---
title: "Get an endpoint"
description: "Publish a Formhaus definition to Formhaus Cloud and put the form on a site with a hosted page, an embed, FormhausForm for React or Vue, or a plain POST."
---

# Get an endpoint

Formhaus Cloud hosts the submission endpoint for a definition. Full documentation is in the [Cloud](/cloud/overview) section.

## Publish

Connect the remote MCP server:

```bash
claude mcp add --transport http formhaus https://api.formhaus.dev/mcp
```

Ask the agent:

```text
Create a waitlist form with an email field and publish it.
```

`publish_form` returns `form_id`, `endpoint`, `hosted_url`, `embed_snippet`, `react_snippet`, `vue_snippet` and, without an account key, `claim_url` and `agent_key`. See [Quickstart](/cloud/quickstart) for the local server, the plugin and every result field.

## Put the form on a site

| Way | Snippet |
|---|---|
| Hosted link | `https://f.formhaus.dev/{form_id}` |
| Embed | `<script src="https://f.formhaus.dev/embed.js" data-form="{form_id}" async></script>` |
| React | `import { FormhausForm } from '@formhaus/react/cloud'` and `<FormhausForm id="{form_id}" />` |
| Vue | `import { FormhausForm } from '@formhaus/vue/cloud'` and `<FormhausForm id="{form_id}" />` |
| POST JSON | `POST https://api.formhaus.dev/f/{form_id}` with `{ "values": {...}, "skippedSteps": [] }` |

Props, status codes, `Idempotency-Key` and validation rules are in [Collecting submissions](/cloud/submissions).

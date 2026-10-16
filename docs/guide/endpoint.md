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
| Hosted link | `https://formhaus.cc/{form_id}` |
| Embed | `<script src="https://formhaus.cc/embed.js" data-form="{form_id}" async></script>` |
| React | `import { FormhausForm } from '@formhaus/react/cloud'` and `<FormhausForm id="{form_id}" />` |
| Vue | `import { FormhausForm } from '@formhaus/vue/cloud'` and `<FormhausForm id="{form_id}" />` |
| POST JSON | `POST https://api.formhaus.cc/f/{form_id}` with `{ "values": {...}, "skippedSteps": [] }` |

`https://api.formhaus.dev/f/{form_id}` accepts the same requests.

`FormhausForm` and `@formhaus/core/cloud` call `https://api.formhaus.cc` by default. If your site sets a Content-Security-Policy `connect-src` allowlist, add `https://api.formhaus.cc`. Pass `apiBase` to use another origin.

Props, status codes, `Idempotency-Key` and validation rules are in [Collecting submissions](/cloud/submissions).

## Bot check

When the form requires a bot check, `FormhausForm` loads `https://formhaus.cc/challenge` in a frame on first focus and sends a new token with each submission. The frame stays hidden unless the check needs a click. If your site sets a Content-Security-Policy, add `frame-src https://formhaus.cc`.

With `@formhaus/core/cloud`, get the token from `createChallengeFrame` and pass it to the submitter:

```ts
import { createChallengeFrame, createSubmitter, fetchForm } from '@formhaus/core/cloud';

const form = await fetchForm({ id: 'FORM_ID' });
const submit = createSubmitter({ id: 'FORM_ID', version: form.version, renderToken: form.renderToken });
const check = form.challenge && createChallengeFrame(form.challenge, 'FORM_ID', () => document.querySelector('#bot-check'));

await submit(values, [], await check?.token());
```

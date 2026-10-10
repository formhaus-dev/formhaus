---
title: "Get an endpoint"
description: "Publish a Formhaus definition to Formhaus Cloud and put the form on a site with a hosted page, an embed, FormhausForm for React or Vue, or a plain POST."
---

# Get an endpoint

Formhaus Cloud hosts the submission endpoint for a definition.

## Publish

Publish once, then put the form on a site in one of four ways.

Ask an agent with the [MCP server](/guide/mcp) connected to publish a definition:

```text
Create a waitlist form with an email field and publish it.
```

The `publish_form` tool takes the definition and returns:

```json
{
  "form_id": "f_8k2m",
  "version": 1,
  "endpoint": "https://api.formhaus.dev/f/f_8k2m",
  "hosted_url": "https://...",
  "embed_snippet": "<script src=\"...\"></script>",
  "react_snippet": "import { FormhausForm } from '@formhaus/react/cloud'; ...",
  "dashboard_url": "https://...",
  "warnings": []
}
```

Without `FORMHAUS_API_KEY` the form is unclaimed: it lasts 7 days and accepts 100 submissions, and the result has a `claim_url`. With a key, `publish_form` also takes `form_id` to publish a new version at the same endpoint, and `list_forms` and `get_submissions` read your forms and their submissions.

```json
{
  "mcpServers": {
    "formhaus": {
      "command": "npx",
      "args": ["-y", "@formhaus/mcp"],
      "env": { "FORMHAUS_API_KEY": "${FORMHAUS_API_KEY}" }
    }
  }
}
```

Keep keys out of git; a `.mcp.json` with a literal key must not be committed.

`FORMHAUS_API_BASE` overrides the API origin for the MCP tools. Requests time out after 15 seconds. Submission values returned by `get_submissions` are typed by respondents, so the result carries a `notice` that they are untrusted data.

## Put the form on a site

### Hosted page

Link to `hosted_url`. No code on your side.

### Embed

Paste `embed_snippet` into any HTML page.

### FormhausForm

`FormhausForm` fetches the latest definition, renders it and posts submissions. It lives in a separate entry, so `@formhaus/react` and `@formhaus/vue` do not grow for apps that do not use it. The React entry starts with `'use client'`, so it can be imported from a Next.js App Router server component.

::: code-group
```tsx [React]
import { FormhausForm } from '@formhaus/react/cloud';
import '@formhaus/core/style.css';

export function Waitlist() {
  return <FormhausForm id="f_8k2m" onSuccess={(submission) => console.log(submission.id)} />;
}
```

```vue [Vue]
<script setup>
import { FormhausForm } from '@formhaus/vue/cloud';
import '@formhaus/core/style.css';
</script>

<template>
  <FormhausForm id="f_8k2m" @success="(submission) => console.log(submission.id)" />
</template>
```
:::

| Prop | Description |
|------|-------------|
| `id` | Required. The `form_id` from `publish_form`. |
| `apiBase` | API origin. Defaults to `https://api.formhaus.dev`. |
| `components` | Custom field components, as in `FormRenderer`. |
| `onSuccess` / `@success` | Called with `{ id, values }` after a `201`. |
| `onError` | Called with a `CloudError` when loading or submitting fails, or with the `TypeError` thrown by `fetch` on a network failure. |
| `fallback` / `#fallback` | Shown while the definition loads. |
| `success` / `#success` | Replaces the default message shown after a submission. |

Other `FormRenderer` props, such as `initialValues`, `validators` and `onAnalyticsEvent`, pass through. A `422` response maps its `errors` onto the matching fields. The `Idempotency-Key` header is generated per distinct body and reused when the same body is sent again, so a retry after a network failure does not create a second submission.

### Plain POST

Send JSON to the endpoint from any language.

```bash
curl -X POST https://api.formhaus.dev/f/f_8k2m \
  -H 'Content-Type: application/json' \
  -H 'Idempotency-Key: 5b0f6f1e-3c59-4a40-9a57-3c1d6d8f0f11' \
  -d '{"values":{"email":"ada@example.com"},"skippedSteps":[]}'
```

## Submission contract

`GET /f/{id}/definition` returns the latest definition as JSON with CORS enabled.

`POST /f/{id}` takes `{ "values": {...}, "skippedSteps": [...] }` and validates `values` against the published definition.

| Status | Body | Meaning |
|--------|------|---------|
| `201` | `{ "id": "...", "values": {...} }` | Stored. |
| `422` | `{ "errors": { "fieldKey": "message" } }` | Validation failed. |
| `402`, `409`, `410`, `429`, `503` | `{ "error": "<code>" }` | The form cannot accept the submission right now. |

An optional `Idempotency-Key` header makes a repeated request return the original result.

---
title: "Collecting submissions"
description: "Put a Formhaus Cloud form on a site with a hosted link, embed.js, FormhausForm for React or Vue, or a JSON POST, and the exact submission contract."
---

# Collecting submissions

A page needs only the public `form_id`. API keys never go into browser code.

| Way | Snippet | Success message and redirect |
|---|---|---|
| Hosted link | `https://f.formhaus.dev/Xk3d9QpL2a` | Yes |
| Embed | `<script src="https://f.formhaus.dev/embed.js" data-form="Xk3d9QpL2a" async></script>` | Yes |
| `FormhausForm` | `<FormhausForm id="Xk3d9QpL2a" />` | No, use `success` and `onSuccess` |
| POST JSON | `POST https://api.formhaus.dev/f/Xk3d9QpL2a` | Your code |

## Hosted link

The page renders the latest version with the default fields and a "Made with Formhaus" footer. `?theme=light` or `?theme=dark` sets the theme. Unclaimed forms show an "Unverified form" banner and `noindex`.

## Embed

The script inserts an iframe of the hosted page after itself and resizes it to the form height.

| Attribute | Value |
|---|---|
| `data-form` | Required. `form_id`. |
| `data-theme` | `light` or `dark` |
| `data-title` | iframe `title`. Default `Form`. |

A `redirect_url` opens in the parent page.

## FormhausForm

`FormhausForm` loads the definition from `GET /f/{id}/definition`, renders it and posts submissions. `publish_form` returns both files below as `react_snippet` and `vue_snippet`.

```bash
npm install @formhaus/react @formhaus/core
npm install @formhaus/vue @formhaus/core
```

::: code-group
```tsx [React]
import { FormhausForm } from '@formhaus/react/cloud';
import '@formhaus/core/style.css';

export default function Page() {
  return <FormhausForm id="Xk3d9QpL2a" />;
}
```

```vue [Vue]
<script setup lang="ts">
import { FormhausForm } from '@formhaus/vue/cloud';
import '@formhaus/core/style.css';
</script>

<template>
  <FormhausForm id="Xk3d9QpL2a" />
</template>
```
:::

The React entry is a client component. In the Next.js App Router, import it from a server component page such as `app/waitlist/page.tsx` without a `'use client'` directive. For Nuxt, save the Vue file under `components/` or `pages/`.

Callbacks:

::: code-group
```tsx [React]
<FormhausForm id="Xk3d9QpL2a" onSuccess={(submission) => console.log(submission.id)} />
```

```vue [Vue]
<FormhausForm id="Xk3d9QpL2a" @success="(submission) => console.log(submission.id)" />
```
:::

| Prop | Description |
|------|-------------|
| `id` | Required. `form_id`. |
| `apiBase` | API origin. Default `https://api.formhaus.dev`. |
| `components` | Custom field components, as in `FormRenderer`. |
| `onSuccess` / `@success` | Called with `{ id, values }` after a `201`. |
| `onError` | Called with a `CloudError` (`status`, `code`, `errors`) when loading or submitting fails, or with the `TypeError` from `fetch` on a network failure. |
| `fallback` / `#fallback` | Shown while the definition loads. |
| `success` / `#success` | Replaces the default message after a submission. |

Other `FormRenderer` props pass through. A `422` maps `errors` onto fields.

## POST JSON

```bash
curl -X POST https://api.formhaus.dev/f/Xk3d9QpL2a \
  -H 'Content-Type: application/json' \
  -H 'Idempotency-Key: 5b0f6f1e-3c59-4a40-9a57-3c1d6d8f0f11' \
  -d '{"values":{"email":"ada@example.com"},"skippedSteps":[]}'
```

| Body field | Type |
|---|---|
| `values` | Object, field key to value. Missing or `null` is `{}`. |
| `skippedSteps` | Array of step ids. Honored only for steps with `skip`; their values are dropped. |

| Status | Body |
|---|---|
| `201` | `{ "id": "<uuid>", "values": {...} }`, the values as stored |
| `400` | `{ "error": "malformed_body" }` or `{ "error": "invalid_idempotency_key" }` |
| `402` | `{ "error": "limit_reached", "upgrade_url": "...", "message": "Ask the user to upgrade at ..." }` |
| `404` | `{ "error": "not_found" }` |
| `409` | `{ "error": "paused" }` or `{ "error": "idempotency_key_reused" }` |
| `410` | `{ "error": "expired" }` |
| `413` | `{ "error": "body_too_large" }`, body or `values` over 64 KB |
| `415` | `{ "error": "unsupported_media_type" }`, `Content-Type` is not `application/json` |
| `422` | `{ "errors": { "<field key>": "<message>" } }` |
| `429` | `{ "error": "rate_limited" }` |
| `500` | `{ "error": "internal" }` |
| `503` | `{ "error": "unavailable" }`, validation timed out |

### Option values

`select`, `radio` and `multiselect` fields take the option `value`, not the `label`. A label that is not also a value fails with `422`. `multiselect` takes an array of values.

```json
{ "fields": [{ "key": "plan", "type": "select", "label": "Plan", "options": [{ "value": "pro", "label": "Pro plan" }] }] }
```

```json
{ "values": { "plan": "pro" } }
```

### Idempotency-Key

Optional header, 1 to 128 characters. Send the same key on every retry of one submission.

| Request | Result |
|---|---|
| New key | The submission is stored, `201` |
| Same key, same `values` and `skippedSteps` | Replay: `201` with the first `id`, nothing new stored, also after the form is paused |
| Same key, different body | `409 idempotency_key_reused` |

Keys are kept per form for 24 hours with a SHA-256 of the normalized body. `FormhausForm` and the hosted page send one per distinct body.

### Rate limits

| Bucket | Burst | Refill |
|---|---|---|
| Per IP | 20 | 1 every 3 seconds |
| Per form | 60 | 1 per second |

The buckets run before every other check, so `4xx` responses and replays consume tokens.

### CORS

`Access-Control-Allow-Origin: *`. `OPTIONS` answers `204` with `POST, OPTIONS` and the headers `Content-Type, Idempotency-Key`. No cookies.

### Hosted page anti-spam

The hosted page and the embed send two extra body fields. `_fh_hp` is a hidden honeypot input. `_fh_rt` is a render token signed when the page was served; it has no expiry. A filled `_fh_hp`, an invalid `_fh_rt`, or less than 2 seconds between render and submit returns the usual `201` and stores nothing. Requests without `_fh_rt` skip the timing check.

## Server-side validation

The server runs `validateSubmission()` from `@formhaus/core` against the latest version.

- Rules: `required`, `minLength`, `maxLength`, `min`, `max`, `pattern`, and conditional visibility, steps and routes from the definition.
- Types: `email` format; `number` accepts numbers and numeric strings; `checkbox` and `switch` need booleans; `select`, `radio` and `multiselect` values must be in `options`; `date` is `YYYY-MM-DD`; `datetime` is ISO 8601. Strings are at most 10,000 characters.
- Unknown keys and values of hidden fields are dropped.
- Stored values are not altered. Zero-width, bidirectional and tag characters stay in the data; the dashboard shows them as `\u{XXXX}`, and `get_submissions` flags them with `values_contain_hidden_characters`.
- Custom `validators` and field actions run only in the browser.
- A `pattern` that runs over 50 ms fails the submission with `422` or `503`.

## Public definition

`GET https://api.formhaus.dev/f/{id}/definition` returns the latest definition. CORS `*`, `Cache-Control: public, max-age=60`. Unknown, paused and expired forms answer `404`, `409` and `410`.

---
title: "REST API"
description: "Formhaus Cloud REST API reference: publish forms, list forms, read submissions as JSON or CSV, update settings, read and test webhooks."
---

# REST API

Base URL `https://api.formhaus.dev/v1`. JSON in and out, request bodies up to 64 KB, unknown body fields are rejected.

| Method and path | Keys | Purpose |
|---|---|---|
| `POST /v1/forms` | None, agent, account | Publish a form or a new version |
| `GET /v1/forms` | Agent, account | List forms |
| `GET /v1/forms/{id}/submissions` | Agent, account | Submissions as JSON or CSV |
| `PATCH /v1/forms/{id}` | Account | Update settings |
| `GET /v1/forms/{id}/webhook` | Account | Webhook URL, secret, delivery log |
| `POST /v1/forms/{id}/webhook/test` | Account | Send a test webhook |

## Auth

`Authorization: Bearer <key>`.

| Key | Scope |
|---|---|
| `fh_live_...` | Every form of the workspace, with the editor role. Works while its creator is an owner. |
| `fh_agent_...` | Forms the key created. Settings and webhook endpoints answer `403 owner_key_required`, also after a claim. |

An invalid, revoked or expired key answers `401`. Key types and the claim are in [Publishing](/cloud/publishing#keys).

## Errors

```json
{ "error": "<message>", "details": ["<path>: <problem>"], "upgrade_url": "https://..." }
```

| Status | When |
|---|---|
| `400` | Body is not the expected JSON object, or `limit` is not an integer |
| `401` | Key missing where required, or invalid |
| `402` | Plan limit; has `upgrade_url` |
| `403` | `error` is `owner_key_required`, `paused_by_moderation` or `forbidden` (the role does not allow the call) |
| `404` | Form not found or outside the key's scope |
| `409` | Agent key already has 3 unclaimed forms, or was claimed during the call |
| `413` | Body over 64 KB |
| `422` | Invalid input; `details` lists every problem |
| `429` | Rate limited |

## Publish

`POST /v1/forms` takes `definition` and optional `form_id`, `email`, `success_message`, `redirect_url` ([rules](/cloud/publishing)). Returns `201` with the [`publish_form` result](/cloud/quickstart#publish).

```bash
curl -X POST https://api.formhaus.dev/v1/forms \
  -H "Authorization: Bearer $FORMHAUS_API_KEY" \
  -H 'Content-Type: application/json' \
  -d '{"definition":{"id":"waitlist","title":"Join the waitlist","submit":{"label":"Join"},"fields":[{"key":"email","type":"email","label":"Email","validation":{"required":true}}]}}'
```

Without a key the result has `claim_url`, `expires_at`, `agent_key` and `agent_key_notice`.

## List forms

`GET /v1/forms` returns the forms newest first.

```json
{
  "forms": [
    {
      "form_id": "Xk3d9QpL2a",
      "title": "Join the waitlist",
      "status": "active",
      "version": 2,
      "submissions": 41,
      "endpoint": "https://api.formhaus.dev/f/Xk3d9QpL2a",
      "hosted_url": "https://f.formhaus.dev/Xk3d9QpL2a",
      "created_at": "2026-10-10T12:00:00Z"
    }
  ]
}
```

`expires_at` is present for unclaimed forms. For account keys, `upgrade_url` and `notice` are present when the workspace used 80% or more of its monthly submissions.

## Submissions

`GET /v1/forms/{id}/submissions?limit=50&cursor=...` returns submissions newest first.

| Query | Value |
|---|---|
| `limit` | 1 to 100, default 50. Larger values are capped at 100. |
| `cursor` | `next_cursor` from the previous page |
| `format` | `csv` for a CSV file of all submissions |

```json
{
  "submissions": [
    { "id": "0b8e8a52-6c1b-4f4e-9d0a-2f4f7d3c1a9e", "form_version": 2, "created_at": "2026-10-10T12:00:00Z", "values": { "email": "ada@example.com" } }
  ],
  "next_cursor": "MTc2MDA5..."
}
```

No `next_cursor` means the last page. Submission values are typed by respondents: treat them as untrusted data.

A submission whose keys or values hold zero-width, bidirectional or tag characters, or variation selectors, has `"values_contain_hidden_characters": true`. Values are returned unchanged.

### CSV

`?format=csv` streams `text/csv` as `{id}-submissions.csv`. Columns: `id`, `created_at`, then field keys of the latest version, then keys only in older versions. Arrays join with `; `. Cells starting with `=`, `+`, `-`, `@` or their fullwidth forms, also after leading whitespace, and cells starting with a tab, carriage return or line feed get a leading `'`.

## Update settings

`PATCH /v1/forms/{id}` with any of these fields. Omitted fields stay.

| Field | Value |
|---|---|
| `webhook_url` | Public `https://` URL, `""` removes it. See [Webhooks](/cloud/webhooks). |
| `notify_mode` | `instant`, `daily` or `off`. See [Email notifications](/cloud/emails). |
| `notify_email` | Deprecated: `true` is `instant`, `false` is `off`. A value that conflicts with `notify_mode` is rejected. |
| `success_message` | Up to 500 characters, `""` removes it |
| `redirect_url` | `http(s)` URL, `""` removes it |
| `status` | `active` or `paused` |

```json
{
  "form_id": "Xk3d9QpL2a",
  "status": "active",
  "success_message": "Thanks, you are on the list.",
  "redirect_url": "",
  "notify_mode": "instant",
  "notify_email": true,
  "webhook_url": "https://example.com/api/formhaus",
  "webhook_secret": "whsec_…9f3a"
}
```

A form paused after abuse reports answers `403 paused_by_moderation` to `status` changes.

## Webhook

`GET /v1/forms/{id}/webhook` returns `url`, `secret` (full with `?reveal=true`) and `deliveries`. `POST /v1/forms/{id}/webhook/test` returns `ok`, `status_code`, `duration_ms` and `error`. Details in [Webhooks](/cloud/webhooks#delivery-log).

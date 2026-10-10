---
title: "Plans, limits and data"
description: "Formhaus Cloud plan limits, submission counting, upgrade links, data region, what is stored, retention and deletion."
---

# Plans, limits and data

Prices are on [Formhaus Cloud](/cloud). Limits enforced by the service:

| Plan | Forms | Submissions | Webhooks and emails | Submission retention |
|---|---|---|---|---|
| Unclaimed | 3 per agent key | 100 in total per form | No | Deleted with the form after 7 days |
| Free | 3 | 100 per month | Yes | 90 days |
| Pro | Unlimited | 25,000 per month | Yes | No automatic deletion |

- Monthly limits count all submissions to the account's forms in the calendar month, UTC.
- Over a limit, `POST /f/{id}` answers `402 limit_reached`, and the REST API and MCP tools return `upgrade_url` with `Ask the user to upgrade at <url>`.
- `list_forms` and `GET /v1/forms` return `upgrade_url` and `notice` from 80% of the monthly limit.
- A definition is at most 32 KB and 100 fields. Rate limits are in [Publishing](/cloud/publishing#unclaimed-forms) and [Collecting submissions](/cloud/submissions#rate-limits).

## Region

The service and its Postgres database run on DigitalOcean in Frankfurt (`fra1`).

## What is stored

| Data | Stored |
|---|---|
| Account | Email, plan |
| Forms | Every published definition version, settings, webhook secret |
| Submissions | Validated `values`, definition version, time, user agent, referrer (each cut at 512 characters), skipped steps |
| IP addresses | Not stored. Rate limits keep them in memory. Abuse reports store an HMAC of the IP with a daily key. |
| API keys, sign-in links, sessions, claim tokens | HMAC or hash only |
| Claim email address | HMAC only; the email itself is sealed in the queued job until sent |
| Webhook deliveries | Last 100 attempts per form |
| Idempotency keys | 24 hours |

## Retention and deletion

| Data | Deleted |
|---|---|
| Unclaimed forms and their submissions | Daily, after expiry |
| Agent keys | Daily, after their last form expires |
| Free plan submissions | Daily, after 90 days |
| Sign-in links and sessions | Hourly, after expiry |
| Webhook deliveries beyond the last 100 | Hourly |
| Database backups | Daily, encrypted with `age`, kept 30 days |

Deleting a form deletes its versions, submissions, idempotency keys and delivery log. Deleting an account deletes its forms. The dashboard and API have no delete action; write to hello@formhaus.dev.

## Security

- Submissions are validated on the server by `@formhaus/core`; the browser cannot skip checks.
- API keys never belong in browser code. Pages use only the public `form_id`.
- Webhooks are signed with HMAC-SHA256 and refuse private addresses. See [Webhooks](/cloud/webhooks).
- The hosted page sets a strict Content-Security-Policy and blocks framing outside the embed.
- Dashboard POST requests check `Sec-Fetch-Site` and `Origin`.

## Legal

[Terms](/legal/terms), [Privacy](/legal/privacy), [DPA](/legal/dpa), [Sub-processors](/legal/sub-processors).

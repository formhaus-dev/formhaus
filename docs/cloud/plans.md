---
title: "Plans, limits and data"
description: "Formhaus Cloud plan limits, submission counting, upgrade links, data region, what is stored, retention and deletion."
---

# Plans, limits and data

Prices are on [Formhaus Cloud](/cloud). Limits enforced by the service:

| Plan | Price | Forms | Submissions | Members | Webhooks and emails | Submission retention |
|---|---|---|---|---|---|---|
| Unclaimed | None | 3 per agent key | 100 in total per form | None | No | Deleted with the form after 7 days |
| Free | $0 | 3 | 100 per month | 1 | Yes | 90 days |
| Pro | $19 per month or $190 per year | Unlimited | 25,000 per month | 3 | Yes | Until deleted |
| Team | $49 per month or $490 per year | Unlimited | 100,000 per month | 10 | Yes | Until deleted |

- The plan belongs to the workspace. Owners see it under **Settings > Usage and plan**.
- Pro and Team are switched on by hand. Pro opens a Stripe checkout and is active within a day of payment. For Team, write to hello@formhaus.dev.
- Monthly limits count all submissions to the workspace's forms in the calendar month, UTC.
- Members count memberships plus pending unexpired invites. See [Teams and roles](/cloud/teams#member-limits).
- Over a limit, `POST /f/{id}` answers `402 limit_reached`, and the REST API and MCP tools return `upgrade_url` with `Ask the user to upgrade at <url>`. The URL is the payment link, or `https://app.formhaus.dev/usage` when none is set.
- `list_forms` and `GET /v1/forms` return `upgrade_url` and `notice` from 80% of the monthly limit.
- A definition is at most 32 KB and 100 fields. Rate limits are in [Publishing](/cloud/publishing#unclaimed-forms) and [Collecting submissions](/cloud/submissions#rate-limits).

## Region

The service and its Postgres database run on DigitalOcean in Frankfurt (`fra1`).

## What is stored

| Data | Stored |
|---|---|
| Account | Email |
| Workspaces | Name, plan, memberships with roles, pending invites (email, role, sent time) |
| Forms | Every published definition version, settings, webhook secret |
| Submissions | Validated `values`, definition version, time, user agent, referrer (each cut at 512 characters), skipped steps |
| IP addresses | Not stored. Rate limits keep them in memory. Abuse reports store an HMAC of the IP with a daily key. |
| API keys, sign-in links, sessions, claim and invite tokens | HMAC or hash only |
| Claim and invite email addresses | The email is sealed in the queued job until sent. Claims keep an HMAC of the address. |
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

Deleting a form deletes its versions, submissions, idempotency keys and delivery log. Owners delete forms in the dashboard, under **Danger zone** in the form settings. Deleting a workspace or an account is described in [Teams and roles](/cloud/teams#deletion). To remove data another way, write to hello@formhaus.dev.

## Security

- Submissions are validated on the server by `@formhaus/core`; the browser cannot skip checks.
- API keys never belong in browser code. Pages use only the public `form_id`.
- Webhooks are signed with HMAC-SHA256, use `https` on port 443 only and refuse private addresses. See [Webhooks](/cloud/webhooks).
- The dashboard, hosted page and emails show zero-width, bidirectional and tag characters, and variation selectors, as `\u{XXXX}`. The REST API and MCP return values unchanged and flag them with `values_contain_hidden_characters`.
- CSV cells that start with a formula character are prefixed with `'`.
- Roles are checked on every call. See [Teams and roles](/cloud/teams).
- The hosted page sets a strict Content-Security-Policy and blocks framing outside the embed.
- Dashboard POST requests check `Sec-Fetch-Site` and `Origin`.

## Legal

[Terms](/legal/terms), [Privacy](/legal/privacy), [DPA](/legal/dpa), [Sub-processors](/legal/sub-processors).

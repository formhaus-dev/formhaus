---
title: "Dashboard"
description: "Formhaus Cloud dashboard pages: forms, responses, form settings, webhooks, New from JSON, API keys, usage, members, account, claim and invite links."
---

# Dashboard

The dashboard at `https://app.formhaus.dev` is for the people who own the forms. Role limits are in [Teams and roles](/cloud/teams).

## Pages

| Page | Path | Who | What it does |
|---|---|---|---|
| Sign in | `/login` | Anyone | Takes an email and sends a one-time link. The answer is the same whether or not an account exists. |
| Continue | `/auth/{token}` | Anyone | Confirms the link on this device and starts a session. |
| Forms | `/` | All roles | Forms of the workspace, search by title or ID |
| New from JSON | `/forms/new` | Owner, editor | Publishes a pasted definition as a new form |
| Form overview | `/forms/{id}` | All roles | Status, 30-day chart, latest version, snippets for the hosted link, endpoint, embed, React and Vue |
| Responses of a form | `/forms/{id}/responses` | All roles | Table, search, date range, detail drawer, CSV export |
| Form settings | `/forms/{id}/settings` | Owner, editor | After submit, webhook, notifications, new version, pause, delete |
| Responses | `/responses` | All roles | Latest responses across all forms |
| Webhooks | `/webhooks` | Owner, editor | Webhook URL and health of every form |
| API keys | `/keys` | Owner | Creates, lists and revokes keys |
| Usage and plan | `/usage` | All roles | Submissions this month, plans |
| Members | `/settings/members` | All roles | Members, invites, roles, workspace name, leave, delete |
| Account | `/settings/account` | All roles | Delete the account |
| Claim | `/claim/{token}` | Anyone | Moves forms published by an agent to the workspace |
| Invite | `/invites/{token}` | Anyone | Joins a workspace |

The top bar shows the submissions meter, the plan, a link to the docs, a theme toggle and the account menu. The account menu lists workspaces and switches between them.

## Sign-in

| Item | Value |
|---|---|
| Sign-in link | One use, valid 15 minutes |
| Session cookie | 30 days, `HttpOnly`, `Secure`, `SameSite=Lax` |
| Account | Created on the first sign-in, with a personal workspace |

## Forms

| Column | Content |
|---|---|
| Title, ID | The ID has a copy button. A `Webhook failing` badge shows after repeated failures. |
| Status | `Active`, `Paused` or `Unverified` (unclaimed) |
| This month | Submissions in the current UTC month |
| Last response | Relative time |
| Created by | `Agent` or `Human` |

A workspace with no forms shows the MCP setup command, the config and a `publish_form` prompt.

## New from JSON

Takes a [Formhaus definition](/api/definition). The definition is checked with `@formhaus/core`; every problem is listed with its path. Publishing creates the form with an endpoint and a hosted link. Plan limits and [publishing rules](/cloud/publishing#rules-and-limits) apply.

## Responses

- Columns come from the latest definition; keys from older versions follow.
- Search and a date range (presets or from and to) filter the table.
- A row opens a drawer with all values, the form version, skipped steps, referrer and user agent. Arrows step through responses.
- **Export CSV** downloads all responses of the form. Format: [REST API](/cloud/rest-api#csv).

## Form settings

| Section | Content |
|---|---|
| After submit | Success message, or a redirect URL. Applies to all versions. |
| Webhook | URL, signing secret with **Reveal** and **Rotate**, **Send test**, last 100 deliveries. See [Webhooks](/cloud/webhooks). |
| Email notifications | `Each response, up to 20 a day, then a daily digest`, `Daily digest only` or `Off`. See [Email notifications](/cloud/emails). |
| Paste JSON as a new version | Publishes a version at the same endpoint. Responses keep the version they were submitted with. |
| Danger zone | **Pause** or **Resume**, and **Delete form** (owner only, type the form title, or the ID for an untitled form, to confirm) |

A paused form answers `409 paused` and the hosted page says it is paused. A form paused after abuse reports stays paused until Formhaus reviews it.

## Webhooks

Lists each form with its URL, a status (`Healthy`, `Failing`, `No deliveries yet`, `Not set`) and the last delivery. A link goes to the form settings.

## API keys

| Action | Result |
|---|---|
| Create | Optional name up to 100 characters. The `fh_live_...` key is shown once. |
| List | Name, prefix, created, last used, revoked state |
| Revoke | The key stops working at once |

A workspace has at most 20 active keys. Keys act as editors of the workspace. Agent keys moved by a claim appear here as `Agent key (claimed YYYY-MM-DD), limited to forms it created`. Use: `Authorization: Bearer <key>` on `https://api.formhaus.dev/mcp` and `https://api.formhaus.dev/v1`.

## Usage and plan

Shows submissions used this month against the limit, a bar per form, the reset date and the three plans. When the limit is reached a banner says new submissions return `402` until the reset. **Upgrade to Pro** is shown to owners. Limits are in [Plans, limits and data](/cloud/plans).

## Members and Account

[Teams and roles](/cloud/teams) describes members, invites, leaving and deletion.

## Claim

The claim page lists the forms that move together and says how many forms of the same agent were published for another email and stay unclaimed. Without a session it links to sign-in and returns after the link is opened in the same browser. Viewers see a notice to switch to a workspace where they are an editor or owner. Rules: [Publishing](/cloud/publishing#claim).

## Hidden characters

The dashboard shows zero-width, bidirectional and tag characters, and variation selectors, as `\u{XXXX}` in respondent values, field keys, form titles, success messages and workspace names. A zero-width joiner between emoji and a variation selector after an emoji stay as they are. The REST API and MCP return values unchanged.

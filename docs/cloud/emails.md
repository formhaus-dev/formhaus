---
title: "Email notifications"
description: "Formhaus Cloud emails: notify_mode instant, daily and off, the 20 per day limit and daily digest, webhook failing, report, claim, sign-in and invite emails."
---

# Email notifications

Claimed forms email workspace members about new responses. Unclaimed forms send none.

## Notification modes

`notify_mode` is a per-form setting. New forms use `instant`.

| Mode | Behavior |
|---|---|
| `instant` | One email per response for the first 20 responses of the form each UTC day. From the 21st, no more per-response emails that day; one daily digest goes out at the next UTC midnight. |
| `daily` | No per-response emails. One daily digest for each UTC day with responses. |
| `off` | No response emails and no digest. |

Set it under **Form settings > Email notifications**, or with an account key:

```bash
curl -X PATCH https://api.formhaus.dev/v1/forms/Xk3d9QpL2a \
  -H "Authorization: Bearer $FORMHAUS_API_KEY" \
  -H 'Content-Type: application/json' \
  -d '{"notify_mode":"daily"}'
```

[`update_form_settings`](/cloud/mcp#update-form-settings) takes the same field. `notify_email` is still accepted: `true` means `instant`, `false` means `off`. A value that conflicts with `notify_mode` is rejected.

## Who gets the emails

| Email | Recipients |
|---|---|
| New response, daily digest | Members who turned emails on |
| Webhook failing, form reported | Members who turned emails on, and every owner |

Each member sets their own switch under **Settings > Members**. It is on for owners by default and off for editors and viewers. Each recipient gets a separate email.

## New response

| Part | Content |
|---|---|
| Subject | `New response: <form title>` |
| Body | Up to 5 fields as label and value, in definition order, then keys not in that version. Values are cut at 300 characters. More fields show as "N more fields in the dashboard." |
| Link | `https://app.formhaus.dev/forms/{form_id}` |

## Daily digest

| Part | Content |
|---|---|
| Subject | `Daily digest: <form title>` |
| Body | Response count for the UTC day, and the first 3 fields of the latest 5 responses. After the 20 per-response emails it says the rest are only in the digest. |
| Link | `https://app.formhaus.dev/forms/{form_id}/responses` |

No digest is sent when the day had no responses or the mode is `off` by then.

## Webhook failing

After 5 failed delivery attempts in a row, owners and members with emails on get `Webhook failing: <form title>` with the last status or error and a link to the delivery log. The count resets on the first successful delivery. At most one email per form per 24 hours; none if the webhook recovered first. See [Webhooks](/cloud/webhooks#failure-email).

## Other emails

| Email | Subject | When |
|---|---|---|
| Sign-in | `Your Formhaus sign-in link` | Sign-in at `/login`. The link works once for 15 minutes. |
| Claim | `Claim your Formhaus form` | `publish_form` with `email`. At most 1 per address per hour. Contains the claim link and no form content. |
| Invite | `You're invited to a Formhaus workspace` | An owner invites or resends. Valid 7 days. See [Teams and roles](/cloud/teams#invites). |
| Form reported | `Your form was reported: <form title>` | A visitor reports a claimed form. At most 1 per form per day. |

## Hidden characters

Titles, field labels and values in emails show zero-width, bidirectional and tag characters as `\u{XXXX}`.

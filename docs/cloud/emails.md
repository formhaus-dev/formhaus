---
title: "Email notifications"
description: "Formhaus Cloud emails: notify_mode milestones and off, the weekly summary, the welcome email, webhook failing, report, claim, sign-in and invite emails."
---

# Email notifications

Claimed forms email workspace members when they reach a response milestone. Unclaimed forms send none.

## Notification modes

`notify_mode` is a per-form setting. New forms use `milestones`.

| Mode | Behavior |
|---|---|
| `milestones` | One email at the 1st, 10th, 100th, 500th, 1,000th, 5,000th, 10,000th, 25,000th, 50,000th and 100,000th response of the form. |
| `off` | No milestone emails. |

Set it under **Form settings > Email notifications**, or with an account key:

```bash
curl -X PATCH https://api.formhaus.dev/v1/forms/Xk3d9QpL2a \
  -H "Authorization: Bearer $FORMHAUS_API_KEY" \
  -H 'Content-Type: application/json' \
  -d '{"notify_mode":"off"}'
```

[`update_form_settings`](/cloud/mcp#update-form-settings) takes the same field. `notify_email` is still accepted: `true` means `milestones`, `false` means `off`. A value that conflicts with `notify_mode` is rejected. `instant` and `daily` are not accepted.

## Who gets the emails

| Email | Recipients |
|---|---|
| Milestone | Members who turned emails on |
| Webhook failing, form reported | Members who turned emails on, and every owner |
| Weekly summary, welcome | The account itself |

Each member sets their own switch under **Settings > Members**. It is on for owners by default and off for editors and viewers. Each recipient gets a separate email.

## Milestone

| Part | Content |
|---|---|
| Subject | `<form title> just got its first response`, then `<form title> reached <count> responses` |
| Body | The form title and the count. No response values. |
| Link | `https://app.formhaus.dev/forms/{form_id}/responses` |

The count is all-time and free plan retention does not lower it. A milestone reached while the form was unclaimed or `off` is not sent later.

## Weekly summary

| Part | Content |
|---|---|
| Subject | `Your week on Formhaus: <N> new responses` |
| When | Mondays at 08:00 UTC, for the previous Monday-to-Monday UTC week |
| Body | Per workspace, the forms with new responses and their counts (10 per workspace, then "and N more"), and the total |
| Link | `https://app.formhaus.dev` |

It goes to accounts with at least one new response in a workspace they belong to. No email is sent for a week without responses. It is on by default; each account turns it off under **Settings > Account**.

## Welcome

One email from the founder about 10 minutes after an account is created. It explains how to connect the MCP server and publish a form. Replies go to the founder.

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

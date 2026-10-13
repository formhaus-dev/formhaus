---
title: "Email notifications"
description: "Formhaus Cloud emails: milestones, every response on Team, the daily digest on Pro and Team, the weekly summary, usage alerts, webhook failing, report, claim, sign-in and invite emails."
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

## Every response

On the Team plan, a form can email every response instead of milestones. Choose **Every response** under **Form settings > Email notifications**. It is off by default. On Free and Pro the option is shown but cannot be selected.

| Part | Content |
|---|---|
| Subject | `New response: <form title>`, or `<N> new responses: <form title>` |
| Body | Up to 5 responses, newest first, with their time in UTC and their values. Password fields are left out. Values are cut at 300 characters and each response shows up to 20 fields. |
| Links | Each response at `https://app.formhaus.dev/forms/{form_id}/responses?r={submission_id}`, and all responses of the form |

The first response sends an email at once. Responses that arrive within 2 minutes of the last email are sent together in one email 2 minutes after it. A workspace gets at most 100 response emails per day (UTC). After that, response emails stop until the next day, and the next day starts with one email that says how many more responses arrived after the cap. While every response is on, milestone emails for the form are not sent. If the workspace leaves Team, the form goes back to milestone emails. `Off` stops both.

## Who gets the emails

| Email | Recipients |
|---|---|
| Milestone, every response | Members who turned emails on |
| Webhook failing, form reported | Members who turned emails on, and every owner |
| Usage alert, payment failed | Every owner |
| Weekly summary, daily digest, welcome | The account itself |

Each member sets their own switch under **Settings > Members**. The daily digest and response emails also carry `List-Unsubscribe` headers with one-click unsubscribe: it turns the daily digest off, or turns that member's emails for the workspace off. It is on for owners by default and off for editors and viewers. Each recipient gets a separate email.

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

## Daily digest

| Part | Content |
|---|---|
| Subject | `<N> new responses in <workspace>` |
| When | About 09:00 in the time zone of the browser that turned it on, or UTC if unknown. It covers the 24 hours before 09:00. |
| Body | The forms with new responses and their counts (10, then "and N more"), and the 3 latest responses with links |
| Link | `https://app.formhaus.dev` |

It is off by default. Members of a Pro or Team workspace turn it on under **Settings > Account**. One email per workspace per day, only for Pro and Team workspaces, and none for a day without new responses.

## Usage alerts

Owners get one email when the workspace reaches 80% of its monthly submission limit and one when it reaches 100%, once each per calendar month (UTC). A plan change during the month starts the alerts again for the new limit. A workspace already past its limit after a downgrade gets the 100% email on its first rejected submission. The email shows the count, the grace and the date the count resets, with a link to **Usage and plan**. See [Plans, limits and data](/cloud/plans).

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

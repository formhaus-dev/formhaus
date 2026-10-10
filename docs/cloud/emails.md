---
title: "Email notifications"
description: "Formhaus Cloud emails: per-submission notifications, throttling with hourly summaries, claim, sign-in and abuse report emails."
---

# Email notifications

Claimed forms email the account owner on each submission. Unclaimed forms send none.

## Settings

`notify_email` is `true` for new forms. Change it with an account key through [`PATCH /v1/forms/{id}`](/cloud/rest-api#update-settings) or [`update_form_settings`](/cloud/mcp#update-form-settings).

```json
{ "notify_email": false }
```

## Submission email

| Part | Content |
|---|---|
| To | The account email |
| Subject | `New response: <form title>` |
| Body | Up to 10 fields as label and value, in definition order, then keys not in that version. Values are cut at 300 characters. More fields show as "…and N more fields." |
| Link | `https://app.formhaus.dev/forms/{form_id}` |

## Throttling

Per form:

1. Up to 10 emails go out within a minute.
2. The 11th submission in that minute pauses per-submission emails until the top of the next UTC hour.
3. At the top of the hour one summary email goes out: `Responses summary: <form title>`, with the count of submissions since the pause.
4. Per-submission emails resume.

No summary is sent when the count is 0.

## Other emails

| Email | Subject | When |
|---|---|---|
| Sign-in | `Your Formhaus sign-in link` | Sign-in at `/login`. The link works once for 15 minutes. |
| Claim | `Claim your Formhaus form` | `publish_form` with `email`. At most 1 per address per hour. Contains the claim link and no form content. |
| Abuse report | `Your form was reported: <form title>` | A visitor reports a claimed form. At most 1 per form per 24 hours. |

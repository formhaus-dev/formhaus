---
title: "Publishing"
description: "How Formhaus Cloud publishes definitions: versions, publishing rules and limits, errors and warnings, unclaimed forms, agent keys and claiming."
---

# Publishing

`publish_form` (MCP) and `POST /v1/forms` (REST) take the same input.

| Field | Rules |
|---|---|
| `definition` | Required. A [Formhaus definition](/api/definition): an object, or a string with the JSON (MCP). |
| `form_id` | Publish a new version of this form. Needs a key that reaches the form. |
| `email` | New form without an account key only. Formhaus emails the claim link. Otherwise ignored with a warning. |
| `success_message` | Up to 500 characters. Shown by the hosted page and the embed. |
| `redirect_url` | Absolute `http://` or `https://` URL, up to 2048 characters. `""` removes it. Ignored with a warning for unclaimed forms. |

## Versions

Each publish with `form_id` adds a version. `form_id`, `endpoint` and links stay the same. Submissions are validated against the latest version and store the `form_version` they were validated against. The form title follows the latest definition's `title`.

## Rules and limits

| Rule | Limit |
|---|---|
| Definition size | 32 KB |
| Fields across all steps | 100 |
| Field types | `text`, `email`, `phone`, `number`, `textarea`, `select`, `multiselect`, `radio`, `checkbox`, `switch`, `date`, `datetime` |
| Refused | `password`, `file`, `autocomplete`, `optionsFrom`, custom types |

## Errors and warnings

Errors reject the publish. Each one names a path in the definition:

```text
publish_form rejected the input. Fix every problem below and call publish_form again:
- definition.fields.0: missing property 'key'
- definition.fields.1.type: "password" is not supported on hosted forms; hosted forms never collect passwords. Supported types: text, email, ...
```

Warnings come from `validateDefinition()` and from ignored inputs. They are returned in `warnings` and do not block the publish.

## Unclaimed forms

A publish without an account key creates an unclaimed form.

| Property | Value |
|---|---|
| Lifetime | 7 days from creation; a daily job deletes expired forms and their submissions |
| Submissions | 100 in total |
| Webhooks and emails | None |
| `redirect_url` | Ignored |
| Hosted page | Banner "Unverified form, do not enter passwords or payment details", `noindex`, Report link |

Limits per IP for publishes without an account key:

| Limit | Value |
|---|---|
| Publish attempts | 60 per hour |
| New unclaimed forms | 5 per hour |
| New agent keys (calls without any key) | 20 per day |
| Claim emails | 1 per hour per address |

The claim email contains the claim link and no form content. An unclaimed form is paused after reports from 3 distinct networks within 24 hours; only Formhaus support resumes it. A report on a claimed form emails the owner instead.

## Keys

| Key | Who creates it | Reaches |
|---|---|---|
| None | | `publish_form` only, creates an unclaimed form |
| `fh_agent_...` | `publish_form` without a key, returned once as `agent_key` | Unclaimed, unexpired forms it created |
| `fh_live_...` | A workspace owner in the dashboard, under **API keys** | Every form of the workspace |

An agent key can list its forms, read their submissions and CSV, publish new versions, and publish up to 3 unclaimed forms. It cannot change settings: settings calls answer `owner_key_required`. It expires with its last form.

An `fh_live_` key acts as an editor of its workspace and works only while the owner who created it is still an owner. See [Teams and roles](/cloud/teams#api-keys-in-a-team).

Send keys as `Authorization: Bearer <key>`. Keep them in server-side configuration, such as `.env` as `FORMHAUS_API_KEY`. Pages need only `form_id`.

## Claim

`claim_url` is `https://app.formhaus.dev/claim/{token}`. The person who opens it signs in and presses **Claim**. The forms go to that person's current workspace; the role there must be editor or owner.

- The claim takes every unclaimed form of the same agent key that was published for the same `email` or without one. Forms published for another email stay unclaimed; the page shows how many.
- Claimed forms stop expiring and count toward the workspace plan. On the Free plan, all forms in the claim must fit the 3-form limit, or nothing is claimed.
- The agent key moves to the workspace as `Agent key (claimed YYYY-MM-DD), limited to forms it created`. It keeps working for the forms it created, and new forms it publishes go to the workspace. It still cannot change settings. Revoke it under **API keys**.

---
title: "Formhaus Cloud: a form backend for apps built with AI"
description: "Formhaus Cloud gives an AI agent one MCP call to publish a form and get a validated submission endpoint, a hosted link and an embed. Free, Pro and Team plans, EU-hosted."
pageClass: lp-page
sidebar: false
---

# Formhaus Cloud

A form backend for apps built with AI: an agent publishes a form definition and gets a submission endpoint that validates on the server.

[Get started](https://app.formhaus.dev/login) · [Endpoint reference](/guide/endpoint) · [Pricing](#pricing)

## How it works

### 1. The agent publishes the form

Connect the remote MCP server and ask for a form. The agent calls `publish_form` with a [form definition](/spec).

```text
Add a waitlist form with an email field and publish it.
```

### 2. It gets an endpoint, a link and snippets

```json
{
  "form_id": "abc123",
  "endpoint": "https://api.formhaus.dev/f/abc123",
  "hosted_url": "https://f.formhaus.dev/abc123",
  "embed_snippet": "<script src=\"https://f.formhaus.dev/embed.js\" data-form=\"abc123\" async></script>",
  "dashboard_url": "https://app.formhaus.dev/forms/abc123",
  "version": 1,
  "warnings": []
}
```

### 3. Submissions are validated on the server

`@formhaus/core` checks every submission against the published definition. An invalid one gets a `422` with a message per field, and nothing is stored.

```json
{ "error": "invalid", "message": "Some values are invalid. Fix each field in errors and submit again.", "errors": { "email": "Enter a valid email" } }
```

## Put a form on a site

Only the public form id goes into a page. API keys never reach the browser.

Hosted link, for a site-less form, social posts and email:

```text
https://f.formhaus.dev/abc123
```

Script embed, for any site including Webflow, WordPress, Tilda, Lovable and plain HTML:

```html
<script src="https://f.formhaus.dev/embed.js" data-form="abc123" async></script>
```

React, for forms that change without a deploy:

```tsx
import { FormhausForm } from '@formhaus/react/cloud';
import '@formhaus/core/style.css';

export function Waitlist() {
  return <FormhausForm id="abc123" />;
}
```

POST JSON from any language or your own UI:

```bash
curl -X POST https://api.formhaus.dev/f/abc123 \
  -H 'Content-Type: application/json' \
  -d '{"values":{"email":"ada@example.com"},"skippedSteps":[]}'
```

A stored submission returns `201` with `{ "id": "...", "values": {...} }`. The full contract is in [Get an endpoint](/guide/endpoint).

## What the owner gets

- Dashboard with a responses table per form.
- CSV export.
- Webhooks signed with a per-form secret, retried with backoff for up to 24 hours.
- Email when a form reaches a response milestone: the 1st, 10th, 100th response and so on.
- REST API with an API key: `POST /v1/forms`, `GET /v1/forms` and `GET /v1/forms/{id}/submissions`, as JSON or CSV.

## Agents

Remote MCP server, nothing to install:

```bash
claude mcp add --transport http formhaus https://api.formhaus.dev/mcp
```

Local [`@formhaus/mcp`](/guide/mcp), which also validates definitions and simulates step paths:

```bash
claude mcp add formhaus -- npx -y @formhaus/mcp
```

Claude Code plugin with the MCP server and form skills:

```bash
claude plugin marketplace add ignsm/formhaus && claude plugin install formhaus@formhaus
```

An agent can publish without an account. Such a form is unclaimed: it accepts 100 submissions and expires after 7 days. The result includes a `claim_url`, and the owner claims the form by email to keep it. Agents with an API key (`fh_live_...`, created in the dashboard) can also publish new versions, list forms and read submissions.

## Security and data

- Data stays in the EU, in Frankfurt.
- Every submission is validated on the server against the published definition.
- IP addresses are not stored with submissions.
- Backups are encrypted.
- Webhook URLs must be HTTPS and cannot point at private or internal addresses.

See the [privacy policy](/legal/privacy), the [terms](/legal/terms) and the [DPA](/legal/dpa).

## Pricing

| | Free | Pro | Team |
|---|---|---|---|
| Price | $0 | $19/month or $190/year | $49/month or $490/year |
| Editors (owners included) | 1 | 3 | 10 |
| Viewers | Unlimited | Unlimited | Unlimited |
| Forms | 3 | Unlimited | Unlimited |
| Submissions per month | 100 | 25,000 | 100,000 |
| Retention | 90 days | Unlimited | Unlimited |
| CSV export | Yes | Yes | Yes |
| Roles (owner, editor, viewer) | Yes | Yes | Yes |
| Webhooks | Yes | Yes | Yes |
| Email notifications | Yes | Yes | Yes |

[Get started](https://app.formhaus.dev/login) with the Free plan. Above the limit the endpoint answers `402`.

## FAQ

### How do I add a form to a site built with Lovable or v0?

Ask the agent to publish the form through Formhaus Cloud, then paste the returned `<script src="https://f.formhaus.dev/embed.js" data-form="ID" async></script>` into the page. In a React or Next.js project, use `FormhausForm` from `@formhaus/react/cloud` instead. Both read the latest published definition, so editing the form does not need a redeploy.

### Can an AI agent create a form backend?

Yes. The agent calls the `publish_form` tool on the MCP server at `https://api.formhaus.dev/mcp` and receives a submission endpoint, a hosted link and an embed snippet in one response. No account is needed for the first publish.

### Where is the data stored?

In Frankfurt, Germany, in the EU. Submissions are kept for the retention period of the plan: 90 days on Free, unlimited on Pro and Team. Deleting an account removes its forms and submissions.

### What happens to forms created without an account?

They are unclaimed. An unclaimed form accepts up to 100 submissions, expires after 7 days and sends no webhooks or notification emails. Open the `claim_url` from the publish result and confirm by email to attach the form to your account.

### How do I verify webhooks?

Each delivery carries a `Formhaus-Signature: t=<unix seconds>,v1=<hex>` header, where `v1` is HMAC-SHA256 of `t + "." + body` keyed with the webhook secret of the form. Recompute it, compare in constant time and reject deliveries whose `t` is more than 5 minutes old. The body is JSON with `form_id`, `submission_id`, `version`, `values` and `created_at`. Deliveries are at-least-once, so deduplicate on `Formhaus-Submission-Id`.

### Is the form definition format open source?

Yes. The [form definition format](/spec), `@formhaus/core`, the React and Vue renderers and the MCP server are MIT licensed. A definition published to Formhaus Cloud also works with the open-source packages and your own backend.

### Can I use my own backend instead?

Yes. Render a definition with `FormRenderer` and post to your own server, and validate there with `validateSubmission` from `@formhaus/core/server`. See [Server-side validation](/guide/server-validation).

### Which fields does the hosted form support?

The standard field types except `file`, `password`, `autocomplete`, fields with `optionsFrom`, and unknown custom types. A publish with such a field is rejected with an error that names it.

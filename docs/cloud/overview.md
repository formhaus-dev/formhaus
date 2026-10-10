---
title: "Cloud overview"
description: "What Formhaus Cloud adds to the open-source Formhaus packages: a submission endpoint, hosted page, embed script, dashboard, webhooks, emails, REST API and remote MCP server."
---

# Cloud overview

Formhaus Cloud hosts the backend for a Formhaus definition. The open-source packages work without it. Pricing is on [Formhaus Cloud](/cloud).

| Feature | Open source (MIT) | Cloud |
|---|---|---|
| Definition format and [JSON Schema](/api/definition) | Yes | Same format |
| Engine `@formhaus/core`: validation, conditions, steps, routes | Yes | Runs on the server for every submission |
| Renderers `@formhaus/react`, `@formhaus/vue` | Yes | `FormhausForm` from `/cloud` entries loads a hosted definition |
| [Figma plugin](/guide/figma) | Yes | No |
| Local MCP server `@formhaus/mcp`: `validate_definition`, `simulate_path`, `capabilities`, `example_definitions` | Yes | No |
| `publish_form`, `list_forms`, `get_submissions` | Proxies in `@formhaus/mcp` | Remote MCP server and REST API |
| `update_form_settings` | No | Remote MCP server |
| Submission endpoint with server-side validation | No | `POST https://api.formhaus.dev/f/{id}` |
| Hosted form page | No | `https://f.formhaus.dev/{id}` |
| Embed script | No | `https://f.formhaus.dev/embed.js` |
| Dashboard with workspaces, roles and invites | No | `https://app.formhaus.dev` |
| Webhooks with signatures | No | Yes |
| Email notifications: instant, daily digest, off | No | Yes |
| REST API and CSV export | No | `https://api.formhaus.dev/v1` |

## Hosts

| Host | Serves |
|---|---|
| `api.formhaus.dev` | Submissions, public definitions, REST API, MCP server |
| `app.formhaus.dev` | Dashboard, sign-in, claim links |
| `f.formhaus.dev` | Hosted pages, `embed.js` |

## Pages

| Page | Content |
|---|---|
| [Quickstart](/cloud/quickstart) | Connect an agent, publish a form, claim it |
| [Publishing](/cloud/publishing) | Versions, rules, limits, unclaimed forms, keys, claim |
| [Collecting submissions](/cloud/submissions) | Hosted link, embed, `FormhausForm`, POST contract |
| [Teams and roles](/cloud/teams) | Workspaces, owner, editor and viewer, invites, member limits, deletion |
| [Dashboard](/cloud/dashboard) | Every page: forms, responses, settings, webhooks, keys, usage, members, account |
| [Webhooks](/cloud/webhooks) | Payload, signature, retries, delivery log |
| [Email notifications](/cloud/emails) | Notification modes, digest, other emails |
| [REST API](/cloud/rest-api) | Endpoints, auth, pagination, CSV |
| [MCP reference](/cloud/mcp) | Remote tools, inputs, outputs, errors |
| [Plans, limits and data](/cloud/plans) | Free, Pro and Team limits, region, retention, security |

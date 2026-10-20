---
title: "Get an endpoint"
description: "Publish a Formhaus definition to Formhaus Cloud and put the form on a site with a hosted page, an embed, FormhausForm for React or Vue, or a plain POST."
---

# Get an endpoint

Formhaus Cloud hosts the submission endpoint for a definition. Full documentation is in the [Cloud](/cloud/overview) section.

## Publish

Connect the remote MCP server:

```bash
claude mcp add --transport http formhaus https://api.formhaus.dev/mcp
```

Ask the agent:

```text
Create a waitlist form with an email field and publish it.
```

`publish_form` returns `form_id`, `endpoint`, `hosted_url`, `embed_snippet`, `react_snippet`, `vue_snippet` and, without an account key, `claim_url` and `agent_key`. See [Quickstart](/cloud/quickstart) for the local server, the plugin and every result field.

## Put the form on a site

| Way | Snippet |
|---|---|
| Hosted link | `https://formhaus.cc/{form_id}` |
| Embed | `<script src="https://formhaus.cc/embed.js" data-form="{form_id}" async></script>` |
| React | `import { FormhausForm } from '@formhaus/react/cloud'` and `<FormhausForm id="{form_id}" />` |
| Vue | `import { FormhausForm } from '@formhaus/vue/cloud'` and `<FormhausForm id="{form_id}" />` |
| POST JSON | `POST https://api.formhaus.cc/f/{form_id}` with `{ "values": {...}, "skippedSteps": [] }` |

`https://api.formhaus.dev/f/{form_id}` accepts the same requests.

`FormhausForm` and `@formhaus/core/cloud` call `https://api.formhaus.cc` by default. If your site sets a Content-Security-Policy `connect-src` allowlist, add `https://api.formhaus.cc`. Pass `apiBase` to use another origin.

Props, status codes, `Idempotency-Key` and validation rules are in [Collecting submissions](/cloud/submissions).

`FormhausForm` and submitters from `createSubmitter` send `utm_source`, `utm_medium`, `utm_campaign`, `utm_term` and `utm_content` from the page address as `attribution`. Cloud stores them apart from the values. Other parameters of the address are not sent.

## Files

`FormhausForm` uploads the file of each `file` field before it submits and sends the upload id as the value. Files go straight from the browser to Cloud storage, up to 10 MB each and 5 per form. A refused file, such as one too large or of a type the form does not accept, shows its message on the field. See [Files](https://formhaus.dev/cloud/submissions#files) for the types and for uploads from your own client.

`createSubmitter` sends values as they are. Upload files yourself before you call it.

## Bot check

When Formhaus Cloud has the bot check on, `FormhausForm` loads `https://formhaus.cc/challenge` in a frame on first focus and sends its token with the submission. The frame stays hidden unless the check needs a click. If your site sets a Content-Security-Policy, add `frame-src https://formhaus.cc`. If the frame cannot load, the form submits without a token and the form's bot check setting decides whether Cloud accepts it. With a self-hosted Cloud, allow your forms host in `frame-src` instead.

With `@formhaus/core/cloud`, get the token from `createChallengeFrame`, pass it to the submitter and call `spend()` after a successful submission or a `verification_failed` error:

```ts
import { createChallengeFrame, createSubmitter, fetchForm } from '@formhaus/core/cloud';

const form = await fetchForm({ id: 'FORM_ID' });
const submit = createSubmitter({ id: 'FORM_ID', version: form.version, renderToken: form.renderToken });
const check =
  form.challenge &&
  createChallengeFrame({ challenge: form.challenge, formId: 'FORM_ID', host: () => document.querySelector('#bot-check') });

await submit(values, { challengeToken: await check?.token() });
check?.spend();
```

## Low-level client

| Function | Options |
|---|---|
| `fetchForm(options)` | `id`, `apiBase?`, `signal?`, `version?`: load at least this form version |
| `createSubmitter(options)` | `id`, `apiBase?`, `version?`, `renderToken?`. Returns `submit(values, { skippedSteps?, challengeToken? })` |
| `createChallengeFrame(options)` | `challenge`, `formId`, `host`: returns the element that holds the frame, `timeout?`, `quiet?` in ms |
| `sessionDraftStore(options?)` | `maxAge?` in ms, one week by default, `storage?`: returns the storage, `sessionStorage` by default |

## Errors

`fetchForm`, the submitter and `FormhausForm`'s `onError` reject with `CloudError`:

| Property | Type | Description |
|---|---|---|
| `status` | `number` | HTTP status, `0` without a response |
| `code` | `KnownCloudErrorCode \| (string & {})` | One of the codes below. A new Cloud version can send a new code, so handle unknown codes in a `default` branch |
| `message` | `string` | A text to show the user |
| `action` | `'retry' \| 'reload' \| null` | What can fix it. `retryable` is `action === 'retry'` |
| `errors` | `Record<string, string> \| undefined` | Field errors for `invalid` |
| `version` | `number \| undefined` | The new form version for `form_updated` |

| `code` | `action` | When |
|---|---|---|
| `network` | `retry` | No response |
| `timeout` | `retry` | No response in 15 s for a load, 30 s for a submission |
| `invalid` | `null` | Values failed validation. See `errors` |
| `rate_limited` | `retry` | Too many requests |
| `limit_reached` | `null` | The plan's response limit is reached |
| `not_found` | `null` | The form does not exist |
| `paused` | `null` | The form is paused |
| `expired` | `null` | The form has expired |
| `body_too_large` | `null` | The submission is too large |
| `idempotency_key_reused` | `retry` | The values changed during a retry |
| `form_updated` | `reload` | The form has a new version. `FormhausForm` loads it and keeps the answers |
| `client_outdated` | `null` | The form needs a newer `@formhaus/core` |
| `verification_failed` | `retry` | The bot check did not pass |
| `verification_timeout` | `retry` | The bot check did not finish |
| `verification_required` | `reload` | The form needs a bot check token |
| `malformed_body` | `reload` | The request body is not valid |
| `unsupported_media_type` | `reload` | The request is not JSON |
| `invalid_idempotency_key` | `reload` | The `Idempotency-Key` header is not valid |
| `invalid_response` | `retry` | The response is not valid JSON |
| `unavailable` | `retry` | Cloud is unavailable |
| `internal` | `retry` | A server error |
| `unknown` | By status | The response has no error code. The status picks the message and `action` |


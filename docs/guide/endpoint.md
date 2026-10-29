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

`FormhausForm` uploads the file of each `file` field before it submits and sends the upload id as the value. For a field with [`multiple`](/guide/fields#several-files), it uploads each file and sends the list of ids. Files go straight from the browser to Cloud storage, up to 10 MB each and 5 per form. A refused file, such as one too large or of a type the form does not accept, shows its message on the field. See [Files](https://formhaus.dev/cloud/submissions#files) for the types and for uploads from your own client.

`createSubmitter` sends values as they are. Upload files yourself before you call it.

## Drafts

`FormhausForm` keeps the answers in `sessionStorage` while the visitor fills the form, and restores them after a reload in the same tab. The draft is tied to the form version and expires after a week. A successful submission deletes it. Closing the tab ends it.

The draft never holds `password`, `file` or `hidden` values. Other answers stay readable by any script on the page while the tab is open. For forms with sensitive answers, such as health questions or a résumé, leave those fields out or turn drafts off:

::: code-group
```tsx [React]
<FormhausForm id="FORM_ID" draftExclude={['diagnosis', 'medication']} />
<FormhausForm id="FORM_ID" draftStore={false} />
```

```vue [Vue]
<FormhausForm id="FORM_ID" :draft-exclude="['diagnosis', 'medication']" />
<FormhausForm id="FORM_ID" :draft-store="false" />
```
:::

`draftExclude` takes field keys. A group key leaves out the whole group, and the key of a field inside a group leaves it out of every item. Pass your own `DraftStore` with `load`, `save` and `clear` as `draftStore` to keep drafts elsewhere.

## Bot check

When Formhaus Cloud has the bot check on, `FormhausForm` loads `https://formhaus.cc/challenge` in a frame as soon as the form shows and sends its token with the submission. The frame stays hidden unless the check needs a click. If your site sets a Content-Security-Policy, add `frame-src https://formhaus.cc`. If the frame cannot load, the form submits without a token and the form's bot check setting decides whether Cloud accepts it. With a self-hosted Cloud, allow your forms host in `frame-src` instead.

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

## Notices

`FormhausForm` shows a notice above the form when a submission fails or the form gets a new version. The notice is a `CloudNotice`:

| Property | Type | Description |
|---|---|---|
| `tone` | `'error' \| 'info'` | `info` after a new form version loads, `error` otherwise |
| `code` | `CloudNoticeCode` | A known [`CloudError` code](#errors), or `form_refreshed` after a new form version loads. Another code takes the code of its HTTP status, else `unknown` |
| `message` | `string` | The text, from `cloudLabels` or the English default |
| `action` | `'retry' \| 'reload' \| null` | The button the notice offers |
| `details` | `string[]` | Messages for keys the form does not render |

`noticePlacement="actions"` moves the notice from above the form to just above the buttons. `noticeComponent` in React and the `notice` slot in Vue replace it. Both get `notice` and `onAction`. Call `onAction(notice.action)` to retry or reload.

::: code-group

```tsx [React]
<FormhausForm
  id="FORM_ID"
  noticePlacement="actions"
  noticeComponent={({ notice, onAction }) => (
    <Alert data-fh-notice tabIndex={-1} tone={notice.tone}>
      {notice.message}
      {notice.action && <Button onClick={() => onAction(notice.action!)}>{notice.action}</Button>}
    </Alert>
  )}
/>
```

```vue [Vue]
<FormhausForm id="FORM_ID" notice-placement="actions">
  <template #notice="{ notice, onAction }">
    <Alert data-fh-notice tabindex="-1" :tone="notice.tone">
      {{ notice.message }}
      <Button v-if="notice.action" @click="onAction(notice.action)">{{ notice.action }}</Button>
    </Alert>
  </template>
</FormhausForm>
```

:::

After a failed submission `FormhausForm` focuses the first element with `data-fh-notice` or the `fh-form__notice` class. Without one, or when that element cannot take focus, it focuses the error summary or the first invalid field. Give a custom notice `tabindex="-1"` so it can take focus.

A custom `layout.actions` or `actionsComponent` receives the notice too. In React it gets `notice` and `onNoticeAction(action)` props, typed by `FormhausFormActionsProps`. In Vue it gets the `notice` prop and emits `noticeAction` when the component declares `notice` in its own `props`. A prop from `extends`, a mixin or an async component is not detected.

`FormhausForm` still renders its notice next to such a component. When the actions component shows the notice itself, pass a `noticeComponent` that returns `null` in React or an empty `notice` slot in Vue, so the notice does not show twice.

### Translate notices

`cloudLabels` translates every text `FormhausForm` shows outside the form: notices by `code`, the `retry` and `reload` buttons, the `submitted` message and the `submitAnother` button. Pass a catalog or a function `(key) => string | undefined`. Missing keys keep the English text. The form's own texts use [`messages` and `labels`](/spec#message-and-label-catalogs).

::: code-group

```tsx [React]
<FormhausForm
  id="FORM_ID"
  cloudLabels={{
    network: 'Keine Verbindung zum Server. Prüfen Sie Ihre Verbindung.',
    verification_failed: 'Die Prüfung ist fehlgeschlagen. Bitte erneut senden.',
    form_refreshed: 'Das Formular wurde aktualisiert. Bitte prüfen Sie Ihre Antworten.',
    retry: 'Erneut versuchen',
    reload: 'Seite neu laden',
    submitted: 'Danke, Ihre Antwort ist angekommen.',
    submitAnother: 'Weitere Antwort senden',
  }}
/>
```

```vue [Vue]
<FormhausForm id="FORM_ID" :cloud-labels="(key) => (te(`cloud.${key}`) ? t(`cloud.${key}`) : undefined)" />
```

:::

A function gets every key, so return `undefined` for keys you have not translated. Some i18n libraries return the key itself for a missing translation.

## Low-level client

| Function | Options |
|---|---|
| `fetchForm(options)` | `id`, `apiBase?`, `signal?`, `version?`: load at least this form version |
| `createSubmitter(options)` | `id`, `apiBase?`, `version?`, `renderToken?`. Returns `submit(values, { skippedSteps?, challengeToken? })` |
| `createChallengeFrame(options)` | `challenge`, `formId`, `host`: returns the element that holds the frame, `timeout?`, `quiet?` in ms |
| `sessionDraftStore(options?)` | `maxAge?` in ms, one week by default, `storage?`: returns the storage, `sessionStorage` by default |

## Errors

`FormhausForm` calls `onError` for every failed load and submission. A resend after a lost file upload is silent. Errors thrown by its step and submit hooks, such as `onBeforeSubmit` and `onStepValidate`, reach `onError` too. Without `onError` they are not shown.

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
| `file_taken` | `null` | An uploaded file is no longer available. `FormhausForm` uploads the file again and resends once |
| `origin_not_allowed` | `null` | The form owner does not allow the form on this site |
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


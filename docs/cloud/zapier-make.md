---
title: "Send responses to Zapier or Make"
description: "Send every Formhaus Cloud response to Zapier or Make with a webhook: create a catch hook, paste its URL into the form settings and send a test."
---

# Send responses to Zapier or Make

Zapier and Make both accept webhooks. Formhaus sends each new response to the webhook URL of the form, so a zap or scenario can pass it on to a spreadsheet, a CRM or a chat channel. Webhooks work on claimed forms on every Formhaus plan.

Checked against Zapier and Make on 13 October 2026. Their plans and screens change, so check their docs if a step looks different. Sources: [Zapier pricing](https://zapier.com/pricing), [Trigger Zaps from webhooks](https://help.zapier.com/hc/en-us/articles/8496288690317-Trigger-Zaps-from-webhooks), [Make webhooks](https://help.make.com/webhooks), [Make Webhooks app](https://apps.make.com/gateway).

## In Formhaus

1. Open the form and go to **Settings**.
2. In the **Webhook** section, paste the URL from Zapier or Make into **URL** and click **Save changes**.
3. Click **Send test**. The button shows once the URL is saved. The test response has the value `test` in every field of the latest version of the form.

## Zapier

Webhooks by Zapier is not on the Zapier Free plan. It needs Professional or higher, from $19.99 a month billed annually or $29.99 billed monthly. The Free plan includes a 14-day trial of premium apps.

1. In the Zap editor, click the trigger step, choose **Webhooks by Zapier**, set **Event** to **Catch Hook**, then click **Continue**.
2. **Pick Off A Child Key** is optional. Set it to `values` if you only want the answers.
3. Click **Continue**. On the **Test** tab, click **Copy** to copy the webhook URL.
4. Paste the URL in Formhaus and send a test, as above.
5. Back in Zapier, click **Test trigger**, then add the actions you need.

## Make

The Webhooks app is available on the Make Free plan, which has 1,000 credits a month. Each module run uses credits.

1. In the Scenario Builder, add **Webhooks** > **Custom webhook**.
2. Next to **Webhook**, click **Add**, enter a **Webhook name** and click **Save**. Copy the URL that Make shows.
3. Run the scenario so it waits for data.
4. Paste the URL in Formhaus and send a test, as above.
5. Add the modules you need. If you add fields to the form later, use **Detect new values** in the module settings and send another test.

Make accepts payloads up to 5 MB. A Formhaus response is at most 1 MB.

## What arrives

Each response is one JSON request. The answers are under `values`, keyed by field:

```json
{"type":"submission.created","form_id":"Xk3d9QpL2a","submission_id":"0b8e8a52-6c1b-4f4e-9d0a-2f4f7d3c1a9e","form_version":2,"version":2,"values":{"email":"ada@example.com"},"created_at":"2026-10-10T12:00:00.123456Z"}
```

- If Zapier or Make does not answer with a `2xx` status, Formhaus retries for about 22 hours. A response can arrive twice, so use `submission_id` to skip duplicates when it matters.
- Every request carries a `Formhaus-Signature` header. Zapier and Make do not need it. Check it only if you forward the request to your own code.
- After 5 failed attempts in a row, owners and members with emails on get a `Webhook failing` email.

Payload fields, signing, retries and the delivery log are in the [webhook reference](/cloud/webhooks).

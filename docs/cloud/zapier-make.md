---
title: "Send responses to Zapier or Make"
description: "Send every Formhaus Cloud response to Zapier or Make with a webhook: create a catch hook, paste its URL into the form settings and send a test."
---

# Send responses to Zapier or Make

Zapier and Make both accept webhooks. Formhaus sends each new response to the webhook URL of the form, so a zap or scenario can pass it on to a spreadsheet, a CRM or a chat channel.

Webhooks work on claimed forms on every plan.

## Zapier

1. In Zapier, create a zap. For the trigger, choose **Webhooks by Zapier** and the **Catch Hook** event. Webhooks by Zapier needs a paid Zapier plan.
2. Copy the webhook URL that Zapier shows. It starts with `https://hooks.zapier.com/`.
3. In Formhaus, open **Form settings > Webhook**, paste the URL and save.
4. Click **Send test** in the same panel.
5. In Zapier, click **Test trigger**. The test response appears with every field of the form set to `test`.
6. Add the actions you need and turn the zap on.

## Make

1. In Make, create a scenario. Add the **Webhooks** module **Custom webhook**, then **Add** a new webhook and copy its address.
2. In Formhaus, open **Form settings > Webhook**, paste the address and save.
3. In Make, click **Run once** so the webhook waits for data.
4. In Formhaus, click **Send test**. Make reads the fields from the test response.
5. Add the modules you need and turn the scenario on.

## What arrives

Each response is one JSON request. The answers are under `values`, keyed by field:

```json
{"type":"submission.created","form_id":"Xk3d9QpL2a","submission_id":"0b8e8a52-6c1b-4f4e-9d0a-2f4f7d3c1a9e","form_version":2,"version":2,"values":{"email":"ada@example.com"},"created_at":"2026-10-10T12:00:00.123456Z"}
```

- If Zapier or Make does not answer with success, Formhaus tries again for about 22 hours. A response can arrive twice, so use `submission_id` to skip duplicates when it matters.
- Every request carries a `Formhaus-Signature` header. Zapier and Make do not need it. Check it only if you forward the request to your own code.
- After 5 failed attempts in a row, owners and members with emails on get a `Webhook failing` email.

Payload fields, signing, retries and the delivery log are in the [webhook reference](/cloud/webhooks).

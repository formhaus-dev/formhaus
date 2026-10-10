---
title: "Webhooks"
description: "Formhaus Cloud webhooks: payload, headers, HMAC-SHA256 signature verification in Node and Go, retries, cancellation, delivery log and test sends."
---

# Webhooks

A claimed form with a `webhook_url` POSTs each new submission to that URL.

## Set up

Set `webhook_url` with an account key through [`PATCH /v1/forms/{id}`](/cloud/rest-api#update-settings) or [`update_form_settings`](/cloud/mcp#update-form-settings). Read the secret with `GET /v1/forms/{id}/webhook?reveal=true` or `reveal_secret: true`.

```bash
curl -X PATCH https://api.formhaus.dev/v1/forms/Xk3d9QpL2a \
  -H "Authorization: Bearer $FORMHAUS_API_KEY" \
  -H 'Content-Type: application/json' \
  -d '{"webhook_url":"https://example.com/api/formhaus"}'
```

| Rule | Value |
|---|---|
| Scheme | `https://` only, no credentials in the URL |
| Address | Public. Private, loopback, link-local and cloud metadata addresses are refused. |
| Checked | On save and on every delivery; the request goes to the resolved IP |
| Redirects | Not followed |
| Secret | `whsec_` and 64 hex characters. A new one is created when a URL is set on a form without one. |
| Removal | `"webhook_url": ""` |

Unclaimed forms send no webhooks.

## Request

```http
POST /api/formhaus HTTP/1.1
Content-Type: application/json
User-Agent: Formhaus-Webhooks/1
Formhaus-Signature: t=1760000000,v1=5257a869e7ecebeda32affa62cdca3fa51cad7e77a0e56ff536d0ce8e108d8bd
Formhaus-Submission-Id: 0b8e8a52-6c1b-4f4e-9d0a-2f4f7d3c1a9e

{"form_id":"Xk3d9QpL2a","submission_id":"0b8e8a52-6c1b-4f4e-9d0a-2f4f7d3c1a9e","version":2,"values":{"email":"ada@example.com"},"created_at":"2026-10-10T12:00:00.123456Z"}
```

| Field | Value |
|---|---|
| `form_id` | Form id |
| `submission_id` | Submission UUID, same as `Formhaus-Submission-Id` |
| `version` | Definition version the values were validated against |
| `values` | Validated values |
| `created_at` | RFC 3339, UTC |

## Verify

`Formhaus-Signature` is `t=<unix seconds>,v1=<hex HMAC-SHA256(secret, t + "." + raw body)>`. The HMAC key is the full `whsec_...` string.

1. Reject when `|now - t|` is over 5 minutes.
2. Compute the HMAC over the raw body bytes, before JSON parsing.
3. Compare in constant time.
4. Deduplicate by `Formhaus-Submission-Id`: delivery is at least once.

::: code-group
```js [Node]
import crypto from "node:crypto";

export function verify(secret, header, rawBody) {
  const { t, v1 } = Object.fromEntries(header.split(",").map((part) => part.split("=")));
  if (Math.abs(Date.now() / 1000 - Number(t)) > 300) return false;
  const expected = crypto.createHmac("sha256", secret).update(`${t}.${rawBody}`).digest("hex");
  const a = Buffer.from(expected);
  const b = Buffer.from(v1 ?? "");
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}
```

```go [Go]
func Verify(secret, header string, body []byte, now time.Time) bool {
	t, v1, ok := strings.Cut(strings.TrimPrefix(header, "t="), ",v1=")
	unix, err := strconv.ParseInt(t, 10, 64)
	if !ok || err != nil || now.Sub(time.Unix(unix, 0)).Abs() > 5*time.Minute {
		return false
	}
	mac := hmac.New(sha256.New, []byte(secret))
	mac.Write([]byte(t + "."))
	mac.Write(body)
	return hmac.Equal([]byte(hex.EncodeToString(mac.Sum(nil))), []byte(v1))
}
```
:::

## Retries

| Response | Result |
|---|---|
| `2xx` | Delivered |
| `3xx`, `4xx` except `408`, `425`, `429` | Cancelled, no retry |
| Blocked address | Cancelled |
| Webhook removed or form deleted | Cancelled |
| `408`, `425`, `429`, `5xx`, timeout, network error | Retried |

Each attempt times out after 10 seconds and reads at most 1 KB of the response. Retries start 30 seconds after the first failure and double up to 3 hours, for 16 attempts over about 22 hours.

## Delivery log

`GET /v1/forms/{id}/webhook` returns `url`, `secret` (masked without `?reveal=true`) and `deliveries`, the last 100 attempts, newest first.

| Field | Value |
|---|---|
| `submission_id` | Submission UUID |
| `attempt` | Attempt number, from 1 |
| `status_code` | HTTP status, `0` when no response |
| `error` | Error text, omitted on success |
| `duration_ms` | Request duration |
| `created_at` | Attempt time |

## Test send

`POST /v1/forms/{id}/webhook/test` signs and sends one payload with `submission_id` `00000000-0000-0000-0000-000000000000` and the value `"test"` for every field of the latest version. It is not retried or logged.

```json
{ "ok": true, "status_code": 200, "duration_ms": 143 }
```

`error` is present when `ok` is `false`. Without a `webhook_url` the call answers `422`.

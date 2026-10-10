---
title: "Dashboard"
description: "Formhaus Cloud dashboard pages: email sign-in, API keys and claiming forms published by an agent."
---

# Dashboard

The dashboard at `https://app.formhaus.dev` is for the human who owns the forms.

| Page | Path | What it does |
|---|---|---|
| Sign in | `/login` | Takes an email and sends a one-time sign-in link. The answer is the same whether or not an account exists. |
| Continue | `/auth/{token}` | Confirms the link on this device and starts a session. |
| Home | `/` | Shows the signed-in email, links to API keys, signs out. |
| API keys | `/keys` | Creates, lists and revokes keys. |
| Claim | `/claim/{token}` | Lists the forms in the claim and moves them to the account. |

## Sign-in

| Item | Value |
|---|---|
| Sign-in link | One use, valid 15 minutes |
| Session cookie | 30 days, `HttpOnly`, `Secure`, `SameSite=Lax` |
| Account | Created on the first sign-in with an email |

## API keys

| Action | Result |
|---|---|
| Create | Optional name up to 100 characters. The `fh_live_...` key is shown once. |
| List | Name, prefix, created and last used dates, revoked state |
| Revoke | The key stops working at once |

An account has at most 20 active keys. A key works as `Authorization: Bearer <key>` for `https://api.formhaus.dev/mcp` and `https://api.formhaus.dev/v1`. Agent keys moved to the account by a claim appear here as `Agent key (claimed YYYY-MM-DD), limited to forms it created` with an `fh_agent_` prefix.

## Claim

The claim page lists the forms that move together and says how many forms of the same agent were published for another email and stay unclaimed. Without a session it links to sign-in and returns to the claim after the sign-in link is opened in the same browser. Rules are in [Publishing](/cloud/publishing#claim).

Form settings that have no dashboard page are available through the [REST API](/cloud/rest-api) and [`update_form_settings`](/cloud/mcp#update-form-settings) with an account key.

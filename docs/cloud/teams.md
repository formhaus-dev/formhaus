---
title: "Teams and roles"
description: "Formhaus Cloud workspaces: owner, editor and viewer roles, invites, member limits per plan, API keys in a team, leaving, account and workspace deletion."
---

# Teams and roles

Forms, API keys and the plan belong to a workspace. People join a workspace with a role.

## Workspaces

- The first sign-in creates a personal workspace named after the part of the email before `@`. The account is its owner.
- An account can belong to several workspaces. The account menu in the top bar lists them with the role in each and switches between them.
- The session stores the current workspace. If it is gone or the membership was removed, the next request uses the oldest membership.
- Claimed forms go to the current workspace of the person who claims them.

## Roles

| Action | Owner | Editor | Viewer |
|---|---|---|---|
| Read forms and responses, export CSV | Yes | Yes | Yes |
| See members and usage | Yes | Yes | Yes |
| Turn own email notifications on or off | Yes | Yes | Yes |
| Leave the workspace | Yes, unless the last owner | Yes | Yes |
| Create forms, paste JSON as a new version | Yes | Yes | No |
| Change success message, redirect, notifications, webhook | Yes | Yes | No |
| Pause and resume forms | Yes | Yes | No |
| Claim forms published by an agent | Yes | Yes | No |
| Delete forms | Yes | No | No |
| Create and revoke API keys | Yes | No | No |
| Invite, remove and change roles of members | Yes | No | No |
| Plan and upgrade | Yes | No | No |
| Rename or delete the workspace | Yes | No | No |

The dashboard hides actions a role cannot take. The service checks the role again on every call and answers `403 forbidden` through the [REST API](/cloud/rest-api) and the [MCP server](/cloud/mcp).

A workspace always has an owner. The last owner cannot leave, be removed or be demoted.

## Invites

An owner invites an email address with a role on **Settings > Members**.

| Item | Value |
|---|---|
| Email subject | `You're invited to a Formhaus workspace` |
| Link | `https://app.formhaus.dev/invites/{token}`, valid 7 days |
| Accepting | Sign in with the invited address, then press **Accept invite** |
| Resend | Creates a new link and stops the old one. At most once per 10 minutes and 5 sends per invite. |
| Revoke | The link stops working |
| Daily limit | 20 invites per workspace |
| Pending list | Visible to owners only |

- Accept needs the inviter to still be an owner. Demoting or removing an owner revokes the invites they sent.
- Joining keeps the other workspaces of the account.
- Email notifications are on for new owners and off for new editors and viewers.

## Member limits

Members and pending unexpired invites count as seats.

| Plan | Members |
|---|---|
| Free | 1 |
| Pro | 3 |
| Team | 10 |

Over the limit, the invite is refused with `Your <plan> plan allows <n> member(s), pending invites included.` Plans are in [Plans, limits and data](/cloud/plans).

## Removing a member

Removing a member, or a member leaving, in one step:

- revokes the API keys that member created in the workspace;
- revokes pending invites for that email;
- ends their access on their next request.

## API keys in a team

| Key | Acts as | Works while |
|---|---|---|
| `fh_live_...` | Editor of the workspace | Its creator is an owner of the workspace |
| `fh_agent_...` after a claim | Editor, limited to forms it created | Its creator is an owner or editor |
| `fh_agent_...` before a claim | Its unclaimed forms only | It has not expired |

Demoting the creator suspends their keys. Removing the creator revokes them. Only owners create keys. Details are in [Publishing](/cloud/publishing#keys).

Settings calls (`PATCH /v1/forms/{id}`, `update_form_settings`) accept `fh_live_` keys only; agent keys, also after a claim, answer `owner_key_required`.

## Deletion

| Action | Where | Confirm | Effect |
|---|---|---|---|
| Delete workspace | **Settings > Members**, owner | Type the workspace name | Deletes its forms, responses, webhooks, API keys, memberships and invites |
| Delete account | **Settings > Account** | Type your email | Deletes the account, its sessions and memberships. Revokes the keys it created and the invites it sent. |

Deleting an account also deletes each workspace where the account is the only member, with its forms and responses. The account stays in workspaces that have other members, and their forms stay. The page lists both groups before you confirm.

Deletion is refused while the account is the only owner of a workspace with other members. Make another member an owner first.

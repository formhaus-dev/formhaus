---
title: "Connect Claude to Formhaus"
description: "Add Formhaus to Claude or ChatGPT as a connector, sign in, pick a workspace, and manage forms by chatting. No code or API key."
---

# Connect Claude

Add Formhaus as a connector, sign in, and ask Claude to work with your forms.

The connector address is:

```text
https://api.formhaus.dev/mcp/account
```

## claude.ai

The Free plan allows one custom connector. Pro, Max, Team and Enterprise allow more.

1. Open Customize (or Settings), then **Connectors**.
2. Click **+ Add**, then **Add custom connector**.
3. Enter the name `Formhaus` and the address above.
4. Click **Add** (or **Continue**), then **Connect**.
5. Sign in to Formhaus.
6. Pick a workspace and click **Allow**.

To use it in a chat, click **+**, then **Connectors**, and turn on Formhaus.

### Team and Enterprise

An Owner adds the connector once.

1. Open Organization settings, then **Connectors**.
2. Click **Add**, then **Custom**, then **Web**.
3. Enter the name `Formhaus` and the address above.

Members then open Customize, then **Connectors**, click **Connect** on Formhaus, and sign in.

## Claude Desktop

Claude Desktop uses the connectors from your Claude account. Add Formhaus on claude.ai and it appears in Desktop. You do not edit any file.

## ChatGPT

Custom connectors are available on paid plans with developer mode. Check your plan. The menu names may differ.

1. Open chatgpt.com, then **Settings**, then **Apps** (or **Plugins**).
2. Under **Advanced**, turn on **Developer mode** if it is off.
3. Click **Create** (or **Add custom MCP server**).
4. Enter the name `Formhaus` and the address above.
5. Set authentication to **OAuth** and click **Create**.
6. Sign in to Formhaus, pick a workspace and click **Allow**.

## Claude Code

```bash
claude mcp add --transport http formhaus https://api.formhaus.dev/mcp/account
```

Sign in through the browser when Claude Code asks. Agents and API keys keep using `https://api.formhaus.dev/mcp`. See [Cloud quickstart](/cloud/quickstart).

## What you allow

After you sign in, Formhaus shows a consent screen.

- You pick one workspace.
- The app can read forms and responses, and create and change forms.
- The app gets your role in that workspace. A viewer can only read.

## Things to ask

- List my forms.
- Summarize this week's responses to the waitlist form.
- Add a phone field to the contact form and publish it.
- Pause the survey.

## Disconnect

1. Open the Formhaus dashboard.
2. Go to **Settings**, then **Connected apps**.
3. Click **Revoke** next to the app.

Access stops immediately.

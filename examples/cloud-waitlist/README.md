# Cloud waitlist example

A waitlist form hosted on Formhaus Cloud, put on a page two ways: a plain HTML embed and a React component.

## Get a form id

Add the Formhaus MCP server to your agent:

```bash
claude mcp add --transport http formhaus https://api.formhaus.dev/mcp
```

Then ask: "Make me a waitlist form and give me the link". The `publish_form` result has a `form_id`. Cursor and other MCP clients use the same URL.

Replace `YOUR_FORM_ID` with that `form_id` in the file you use.

## Plain HTML

[index.html](index.html) loads `embed.js`, which inserts the hosted form as an iframe. Open the file in a browser.

## React

[react/src/App.tsx](react/src/App.tsx) renders the form with `FormhausForm` from `@formhaus/react/cloud`.

```bash
cd react
pnpm install
pnpm dev
```

Submissions go to Formhaus Cloud. Read them in the dashboard, with `get_submissions` or the REST API.

---
title: "Generate and check forms with AI agents"
description: "Generate and check forms with AI agents: the Formhaus JSON Schema and a Claude Code plugin with a form skill, validate_definition and simulate_path."
---

# How do I generate and check forms with AI agents?

A Formhaus form is a JSON definition, so an agent writes data instead of component code. The JSON Schema at `https://formhaus.dev/schema/form-definition.json` tells the agent and the editor which keys are valid, the Formhaus Claude Code plugin adds the `/formhaus:formhaus-create-form` skill that drafts definitions from a description, CSV or screenshot, and the `@formhaus/mcp` server that checks the result against the real `FormEngine` with `validate_definition` and `simulate_path`.

## Definition

A support form an agent might produce. The `$schema` line enables completion and validation in VS Code, Cursor and JetBrains editors.

<<< @/recipes/definitions/support-request.json

## 1. Install the Claude Code plugin

```bash
claude plugin marketplace add ignsm/formhaus && claude plugin install formhaus@formhaus
```

Inside a Claude Code session, `/plugin marketplace add ignsm/formhaus` and `/plugin install formhaus@formhaus` do the same. The plugin bundles the `/formhaus:formhaus-create-form` skill and the `@formhaus/mcp` server, which exposes `validate_definition`, `simulate_path`, `capabilities` and `example_definitions`.

To add only the server, run `claude mcp add formhaus -- npx -y @formhaus/mcp`. For Claude Desktop and Cursor, see [MCP Server setup](/guide/mcp#claude-desktop-and-cursor).

## 2. Generate a definition

```
/formhaus:formhaus-create-form
```

Then describe the form: "Support form: topic select, order number for billing, message, screenshot for bugs, email". The skill infers field types and validation, asks about steps and conditions when the input does not say, and checks the result with the MCP server.

## 3. Validate it

`validate_definition` with `{ "definition": <the JSON above> }` returns:

```json
{ "valid": true, "errors": [], "warnings": [] }
```

Errors come from the JSON Schema and from checks the engine enforces. A route from `details` back to `topic` returns:

```json
{
  "valid": false,
  "errors": ["Invalid route from \"details\" to \"topic\": targets must be later steps or null."],
  "warnings": []
}
```

## 4. Simulate a path

`simulate_path` with these answers and actions walks the bug branch and skips the screenshot:

```json
{
  "answers": { "topic": "bug", "message": "The export button does nothing.", "email": "ann@example.com" },
  "actions": ["next", "next", "skip"]
}
```

Output, without the `validation` report and with `path` entries shown without `title`:

```json
{
  "ok": true,
  "multiStep": true,
  "path": [
    { "id": "topic", "visited": true, "skipped": false, "visibleFields": ["topic"] },
    { "id": "details", "visited": true, "skipped": false, "visibleFields": ["message"] },
    { "id": "screenshot", "visited": true, "skipped": true, "visibleFields": ["screenshot"] },
    { "id": "contact", "visited": true, "skipped": false, "visibleFields": ["email"] }
  ],
  "currentStep": { "id": "contact", "title": "How do we reach you?", "index": 3 },
  "isLastStep": true,
  "trace": [
    { "action": "next", "from": "topic", "to": "details", "moved": true },
    { "action": "next", "from": "details", "to": "screenshot", "moved": true },
    { "action": "skip", "from": "screenshot", "to": "contact", "moved": true }
  ],
  "errors": {},
  "wouldSubmit": true,
  "submitValues": { "topic": "bug", "message": "The export button does nothing.", "email": "ann@example.com" }
}
```

With `"topic": "billing"` the `screenshot` step leaves the path and `orderId` appears on the first step.

## 5. Add instructions to your repository

Paste this into `AGENTS.md` or `CLAUDE.md` so every agent session follows the same rules. Cursor users can copy [`.cursor/rules/formhaus.mdc`](https://github.com/ignsm/formhaus/blob/main/.cursor/rules/formhaus.mdc) into their project's `.cursor/rules/` instead, as described in [Cursor rule](/guide/mcp#cursor-rule).

```markdown
## Forms

Forms are Formhaus JSON definitions rendered with `FormRenderer` from `@formhaus/react` or `@formhaus/vue`.

- Start every definition with `"$schema": "https://formhaus.dev/schema/form-definition.json"`.
- Use `fields` for a single page or `steps` for a multi-step form, never both.
- Put conditional fields and steps in `show` / `showAny`, and branching in `routes`. Route targets must be later steps or `null`.
- Keep visibility, validation and step logic in the definition, not in components.
- After every change, call the `formhaus` MCP tool `validate_definition` and fix all errors and warnings.
- For multi-step forms, call `simulate_path` once per branch and check `path` and `submitValues`.
- Call `capabilities` for the supported field types, validation rules and condition operators.
```

## How it works

- The schema is generated from the TypeScript `FormDefinition` type and ships in `@formhaus/core` as `@formhaus/core/schema.json`.
- `validate_definition` runs the schema and `validateDefinition()` from `@formhaus/core`. It reports unknown route targets, backward routes, duplicate step ids and branches that fall through into a sibling.
- `simulate_path` applies `answers` as initial values and presses `next`, `back` and `skip` in order. Without `actions` it presses Next until the last step or the first blocking error.
- `simulate_path` does not run custom validators, `onStepValidate` or lifecycle hooks. Test those in the app.
- `capabilities` lists field types, field props, validation rules, condition operators and route semantics, so the agent does not invent keys.

## Related

- [MCP Server](/guide/mcp): setup and tool reference
- [/formhaus:formhaus-create-form](/guide/formhaus-create-form): input formats and output
- [Definition Reference](/api/definition#json-schema): the JSON Schema
- [Figma to React](/recipes/figma-to-react): draw the generated definition in Figma

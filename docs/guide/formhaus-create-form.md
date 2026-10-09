---
title: "/formhaus:formhaus-create-form Claude Code skill"
description: "Generate a Formhaus JSON form definition from a text description, CSV data or a screenshot of a form with the /formhaus:formhaus-create-form Claude Code skill."
---

# /formhaus:formhaus-create-form

Generate an `@formhaus/core` form definition from a description, CSV data, or a screenshot.

## Prerequisites

- [Claude Code](https://claude.ai/code) installed
- The Formhaus Claude Code plugin

Install the plugin:

```bash
claude plugin marketplace add ignsm/formhaus
claude plugin install formhaus@formhaus
```

Inside a Claude Code session, `/plugin marketplace add ignsm/formhaus` and `/plugin install formhaus@formhaus` do the same after a confirmation prompt.

The plugin also starts the [MCP server](/guide/mcp). The skill uses it to validate the definition and simulate step paths before it shows the result.

## Usage

```
/formhaus:formhaus-create-form
```

Plugin skills are namespaced with the plugin name. Claude also picks the skill on its own when the request matches.

Then describe your form:

> "Registration form with name, email, password, confirm password, and agree to terms"

The skill infers field types and validation rules, then asks about steps and conditional visibility when the answer is not clear from the input. It returns JSON that matches the current `FormDefinition` type.

## Input formats

| Format | Example |
|--------|---------|
| Text description | "Contact form with name, email, and message" |
| CSV/table | A table with columns: key, type, label, required |
| Screenshot | Path to an image of an existing form |
| Example reference | "Like the multi-step example but add a payment step" |

## Output

The generated form definition works with:

- The [Figma plugin](/guide/figma): paste into the Generate tab
- [React adapter](https://github.com/ignsm/formhaus/tree/main/packages/react): pass to `FormRenderer`
- [Vue adapter](https://github.com/ignsm/formhaus/tree/main/packages/vue): pass to `FormRenderer`

## Next steps

- [/formhaus:formhaus-figma-connect](/guide/formhaus-figma-connect): connect your design system to the Figma plugin
- [Field Types](/guide/fields): all supported form field types
- [Definition Reference](/api/definition): full TypeScript types

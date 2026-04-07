# /figma-connect

Auto-detect your Figma design system components and generate a [component map](/guide/figma#component-map) for the Figma plugin.

## Prerequisites

- [Claude Code](https://claude.ai/code) installed
- The formhaus repo cloned locally
- [Figma MCP server](https://developers.figma.com/docs/figma-mcp-server/) connected to Claude Code

## Setting up Figma MCP

The Figma MCP server connects Claude Code to the Figma API.

### 1. Install the Figma MCP server

Follow the official guide: [Figma MCP Server Setup](https://developers.figma.com/docs/figma-mcp-server/)

### 2. Verify the connection

```
Ask Claude: "Can you connect to Figma? Try whoami."
```

If it returns your Figma user info, you're connected. The skill also checks this automatically and guides you through setup if needed.

### What Figma MCP enables

Once connected, Claude can:

- **Search your design system** for components by name
- **Take screenshots** of any Figma node
- **Read component metadata** (variants, properties, structure)
- **Generate component maps** automatically

## Usage

```
/figma-connect
```

The skill:
1. Checks your Figma MCP connection (guides setup if needed)
2. Asks for your Figma design system file URL
3. Searches for form components (inputs, checkboxes, buttons, etc.)
4. Shows screenshots of found components for confirmation
5. Asks you to fill in any components it couldn't auto-detect
6. Detects whether your inputs are variants of one component set or standalone
7. Generates the complete component map JSON

Paste the output into the Figma plugin's **Component Map** tab.

## Typical workflow

A complete workflow from idea to Figma mockup:

1. **Describe your form** to Claude, or run [`/form-schema`](/guide/form-schema-skill)
2. Claude generates the JSON schema
3. Run `/figma-connect` to map your design system (one-time setup)
4. Paste the schema into the Figma plugin
5. Click **Generate**, your form renders with your design system components

After the initial setup, you only need steps 1, 4, and 5 for each new form.

## Next steps

- [Figma Plugin](/guide/figma): how the plugin works, component map reference
- [/form-schema](/guide/form-schema-skill): generate schemas from descriptions
- [Examples](/guide/examples): example schemas to try with the plugin

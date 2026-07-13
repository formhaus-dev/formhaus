# /formhaus-figma-connect

Search a Figma library for form components and generate a [component map](/guide/figma#component-map) for the plugin.

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

If it returns your Figma user info, the connection works. The skill runs the same check before searching a file.

### What Figma MCP enables

Once connected, the skill can:

- Search components by name
- Show screenshots for confirmation
- Read variants, properties, and layer names
- Write the confirmed mappings as JSON

## Usage

```
/formhaus-figma-connect
```

The skill checks the MCP connection, asks for a Figma file URL, and searches for inputs, selection controls, and buttons. You confirm matches from screenshots and provide any missing components before it writes the map.

Paste the output into the Figma plugin's **Component Map** tab.

## Typical workflow

1. Describe the form to Claude, or run [`/formhaus-create-form`](/guide/formhaus-create-form)
2. Claude generates the form definition
3. Run `/formhaus-figma-connect` to map your design system (one-time setup)
4. Paste the definition into the Figma plugin
5. Click **Generate** to create the form with those components

After the initial setup, you only need steps 1, 4, and 5 for each new form.

## Next steps

- [Figma Plugin](/guide/figma): how the plugin works, component map reference
- [/formhaus-create-form](/guide/formhaus-create-form): generate form definitions from descriptions
- [Examples](/guide/examples): example definitions to try with the plugin

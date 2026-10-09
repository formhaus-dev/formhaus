# /formhaus-figma-connect

Find your form components in a Figma library and bind them to the [Figma plugin](/guide/figma#my-components).

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
- Write the confirmed bindings into your Figma file

## Usage

```
/formhaus-figma-connect
```

The skill checks the MCP connection and asks for the URL of the file where you design forms. It searches your libraries for inputs, selects, selection controls and buttons, and shows each match as a screenshot. After you confirm, it writes the bindings into that file. Open the plugin's **Components** tab to check them.

## Typical workflow

1. Describe the form to Claude, or run [`/formhaus-create-form`](/guide/formhaus-create-form)
2. Claude generates the form definition
3. Run `/formhaus-figma-connect` to map your design system (one-time setup)
4. Paste the definition into the plugin's **JSON** mode, or build the form in **Fields**
5. Click **Generate form** to create it with your components

After the initial setup, you only need steps 1, 4, and 5 for each new form.

## Next steps

- [Figma Plugin](/guide/figma): how the plugin works and how bindings fall back
- [/formhaus-create-form](/guide/formhaus-create-form): generate form definitions from descriptions
- [Examples](/guide/examples): example definitions to try with the plugin

---
name: formhaus-figma-connect
description: |
  Bind a Figma design system to the Formhaus Figma plugin through MCP. Finds form
  components (inputs, selects, checkboxes, radios, switches, buttons) in the user's
  libraries, confirms each match with a screenshot, and writes the bindings into
  the Figma file so the plugin's Components tab is set up.
  Use when: "connect figma", "figma components", "bind components",
  "formhaus figma", "setup plugin", "map design system", or when the user wants
  the Figma plugin to render forms with their own components.
allowed-tools:
  - Read
  - AskUserQuestion
  - mcp__plugin_figma_figma__whoami
  - mcp__plugin_figma_figma__search_design_system
  - mcp__plugin_figma_figma__get_screenshot
  - mcp__plugin_figma_figma__get_metadata
  - mcp__plugin_figma_figma__use_figma
---

# Bind a design system to the Formhaus plugin

The plugin renders every form element through a **role**. You find a component for each role in the user's design system, confirm it with them, and write the result into the Figma file where they build forms. Afterwards the plugin's **Components** tab shows every role as bound.

## Roles

| Role | What it renders | Search terms |
|---|---|---|
| `field.text` | Text, email, phone, number, password inputs | input, text field, textbox |
| `field.select` | Select and autocomplete | select, dropdown, combobox |
| `field.textarea` | Multi-line text | textarea, text area |
| `field.date` | Date and date-time | date picker, date input |
| `field.file` | File upload | file upload, dropzone |
| `field.checkbox` | A single checkbox with its label | checkbox |
| `field.switch` | A switch with its label | switch, toggle |
| `option.radio` | One row of a radio group | radio |
| `option.checkbox` | One row of a checkbox group | checkbox |
| `button.primary` | Submit and Continue | button primary, button filled |
| `button.secondary` | Back and Cancel | button secondary, button outline |

Roles you skip still render. Select, date, file and text area reuse the bound text field or select. Checkbox, switch and checkbox options reuse each other. Anything left falls back to the built-in kit. Bind at least `field.text` and `button.primary`.

## Workflow

### 1. Check the connection

Call `whoami`. If it fails, tell the user to set up the Figma MCP server (https://developers.figma.com/docs/figma-mcp-server/) and stop.

### 2. Get the target file

Ask for the URL of the Figma file where they design forms. The bindings are stored in that file. Extract `fileKey` from `https://figma.com/design/:fileKey/:fileName`. The file needs the design system library enabled, or must contain the components itself.

### 3. Find candidates

For each role, run `search_design_system` on the target file with the search terms from the table. Keep the 2–3 best matches per role. Prefer component sets whose variants match the role, for example a `Button` set with `Type=Primary` and `Type=Secondary`. Skip icon-only buttons, chips, cards and banners.

When a match is a component set, pick the variant that looks like an empty, enabled field with a label and no error: `State=Default`, `Size=M`, `Header=True`. For buttons, pick the primary and secondary variants of the same set.

### 4. Confirm with screenshots

Show each candidate with `get_screenshot` and ask the user to confirm the match per role, pick another, or skip the role. Never bind a role the user did not confirm.

### 5. Text slots (only when needed)

The plugin finds the label, value and helper text layers by name (`Label`, `Title`, `Placeholder`, `Value`, `Hint`, `Helper text`, `Supporting text` and similar). If a confirmed component uses other names, read its layers with `get_metadata` and add a `text` entry for that role, for example `{ "label": "Header", "value": "Input text", "helper": "Caption" }`. Use `""` for a slot that should stay empty.

### 6. Write the bindings

Write all confirmed roles in one `use_figma` call on the target file. Use component **keys** for library components. Import each key first so a wrong key fails before anything is saved:

```js
const bindings = {
  'field.text': { source: 'library', key: 'KEY', name: 'Text field / State=Default' },
  'button.primary': { source: 'library', key: 'KEY', name: 'Button / Type=Primary' },
};
const failed = [];
for (const [role, binding] of Object.entries(bindings)) {
  try { await figma.importComponentByKeyAsync(binding.key); } catch { failed.push(role); delete bindings[role]; }
}
const raw = figma.root.getSharedPluginData('formhaus', 'config');
const config = raw ? JSON.parse(raw) : { version: 1, source: 'custom', kit: 'material', bindings: {}, kitNodes: {} };
config.bindings = { ...config.bindings, ...bindings };
config.source = 'custom';
figma.root.setSharedPluginData('formhaus', 'config', JSON.stringify(config));
return { bound: Object.keys(bindings), failed };
```

For components that live in the target file itself, bind by node id instead: `{ source: 'local', id: '12:34', key: 'KEY', name: '…' }`.

A binding can also carry `properties`, the variant and boolean values to set on every instance, keyed like `instance.componentProperties`. It can carry `text`, the slot overrides from step 5. Leave both out unless the user asked for a specific configuration.

### 7. Report

Tell the user which roles are bound, which were skipped and which failed to import. Explain that skipped roles reuse a related component or the built-in kit. Ask them to open the plugin's **Components** tab to check the previews.

## Rules

- Confirm every role with a screenshot before writing it.
- Merge into the existing config, never replace other bindings.
- One `use_figma` write for all roles, after the user has confirmed them.
- Do not invent component keys. Use only keys returned by `search_design_system` or read from the file.

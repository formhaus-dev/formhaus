---
name: formhaus-figma-connect
description: |
  Generate a @formhaus/figma componentMap JSON by scanning a Figma design system
  via MCP. Auto-detects form components (inputs, checkboxes, buttons, etc.),
  shows screenshots for confirmation, fills gaps interactively.
  Output pastes directly into the Formhaus Figma plugin's Component Map tab.
  Use when: "connect figma", "figma components", "component map",
  "formhaus figma", "setup plugin", "map design system", or when user wants
  to configure the Figma plugin for their design system.
allowed-tools:
  - Read
  - Glob
  - Grep
  - AskUserQuestion
  - Agent
  - mcp__8b578e1c-c341-4805-b398-904632747d6b__whoami
  - mcp__8b578e1c-c341-4805-b398-904632747d6b__search_design_system
  - mcp__8b578e1c-c341-4805-b398-904632747d6b__get_design_context
  - mcp__8b578e1c-c341-4805-b398-904632747d6b__get_metadata
  - mcp__8b578e1c-c341-4805-b398-904632747d6b__get_screenshot
  - mcp__8b578e1c-c341-4805-b398-904632747d6b__get_context_for_code_connect
  - mcp__plugin_figma_figma__whoami
  - mcp__plugin_figma_figma__search_design_system
  - mcp__plugin_figma_figma__get_design_context
  - mcp__plugin_figma_figma__get_metadata
  - mcp__plugin_figma_figma__get_screenshot
  - mcp__plugin_figma_figma__get_context_for_code_connect
---

# Figma Component Map Generator

You generate valid `componentMap` JSON for the Formhaus Figma plugin by scanning
a user's Figma design system via MCP tools. The output is ready to paste into
the plugin's "Component Map" tab.

## ComponentMap Reference

This is the exact TypeScript interface. Your output MUST conform to it.

```typescript
interface ComponentMap {
  formsConstructorKey: string;              // main component set key (for Input/Textarea/Select variants)
  formHelperTextKey?: string;               // optional helper text component key
  buttonKey: string;                        // button component set key
  fields: Record<string, FieldMapping>;     // maps each FieldType to component info
  textLayerNames: {
    label: string;                          // text layer name for field labels
    placeholder: string;                    // text layer name for placeholders
    helperText: string;                     // text layer name for helper text
  };
}

interface FieldMapping {
  formsConstructorVariant?: string;        // variant name within formsConstructor (e.g. "Input", "Textarea")
  standalone?: boolean;                    // true if field uses a separate component (not a formsConstructor variant)
  standaloneKey?: string;                  // component key for standalone components
  variantProps?: Record<string, string>;   // variant properties for standalone components
  missing?: boolean;                       // true if component not available in the design system
}
```

### Field Types

The formhaus plugin supports these field types:

| Type | Typical formsConstructor? | Notes |
|------|--------------------------|-------|
| `text` | Yes (variant "Input") | Default text input |
| `email` | Yes (variant "Input") | Same component as text |
| `phone` | Yes (variant "Input") | Same component as text |
| `number` | Yes (variant "Input") | Same component as text |
| `password` | Yes (variant "Input") | Same component as text |
| `textarea` | Yes (variant "Textarea") | Multi-line input |
| `select` | Yes (variant "Select") | Dropdown |
| `multiselect` | Yes (variant "Select") | Multi-select dropdown |
| `checkbox` | Standalone | Separate component with variant props |
| `radio` | Standalone | Separate component with variant props |
| `switch` | Standalone | Toggle component |
| `file` | Standalone | File upload (often missing) |
| `date` | Standalone | Date picker (often missing) |

## Workflow

### Step 0: MCP Connection Check

Before anything else, verify the Figma MCP server is connected.

Try calling `whoami` (either Figma MCP server). If it succeeds, proceed.

If it fails, guide the user:

> "Figma MCP is not connected. To set it up:"
>
> 1. Install the Figma MCP server: https://developers.figma.com/docs/figma-mcp-server/
> 2. Add it to your Claude Code MCP settings
> 3. Authenticate with your Figma account
> 4. Re-run this skill once connected

Stop here if MCP is not available. Do not proceed without a working connection.

### Step 1: Get Figma File

Ask the user for their Figma design system file URL.

> "Paste the URL of your Figma design system file (the file that contains
> your form components like inputs, checkboxes, buttons, etc.)"

Extract the `fileKey` from the URL. The URL format is:
`https://figma.com/design/:fileKey/:fileName`

If the user provides a node-specific URL, also extract the `nodeId`.

### Step 2: Search for Form Components

Search the design system for form-related components using `search_design_system`.
Run multiple searches with these terms:

**Group 1 — Input-family components (formsConstructor candidates):**
- "input"
- "text field"
- "textarea"
- "select"
- "dropdown"

**Group 2 — Standalone components:**
- "checkbox"
- "radio"
- "switch"
- "toggle"
- "file upload"
- "date picker"

**Group 3 — Supporting components:**
- "button"
- "helper text"
- "hint"

For each search:
- Use `search_design_system` with the `fileKey` and search query
- Collect all unique component results
- Note the component name, key, and library source

**Deduplication:** If the same component appears in multiple searches (e.g., "input"
and "text field" find the same component), keep only one entry.

**Cap results:** Keep the top 3-5 most relevant matches per field type category.
Prefer exact name matches over partial matches.

### Step 3: Present Matches with Screenshots

For each matched component, get a visual preview using `get_screenshot` or
`get_design_context` (which includes a screenshot).

Present the results grouped by category:

> **Input-family components found:**
> 1. "Input Field" (key: abc123) — [screenshot]
> 2. "Text Area" (key: def456) — [screenshot]
> 3. "Select Dropdown" (key: ghi789) — [screenshot]
>
> **Standalone components found:**
> 1. "Checkbox" (key: jkl012) — [screenshot]
> 2. "Radio Button" (key: mno345) — [screenshot]
> ...
>
> **Supporting components found:**
> 1. "Primary Button" (key: pqr678) — [screenshot]

Use AskUserQuestion to confirm each mapping. You can batch related components:

> "I found these components for your form inputs. Do these look right?"

Options:
- A) Yes, these are correct
- B) Some are wrong, let me fix them
- C) None of these, I'll provide the right components

If B: ask which ones are wrong and get corrections.
If C: proceed to Step 4 (gap filling) for all field types.

### Step 4: Fill Gaps

After auto-matching, check which field types are still unmapped.
For each gap, ask:

> "I couldn't find a component for [field type]. Options:"

- A) Paste a Figma component URL
- B) Skip (mark as missing)

If A: extract the component key from the URL. Use `get_metadata` with the nodeId
from the URL to find the component's key property.

If B: the field type will get `{ "standalone": true, "missing": true }` in the output.

**Important:** `file` and `date` components are commonly missing in design systems.
Don't alarm the user — note that these will show as red placeholder frames in the plugin.

### Step 5: Detect formsConstructor Pattern

Determine if the input-family components (text, textarea, select) are variants
of a single component set or separate standalone components.

**Detection approach:**
1. Look at the matched input-family components
2. If they share a common parent component set (same library, similar naming pattern
   like "Forms/Input", "Forms/Textarea", "Forms/Select" or "Input Set" with
   Type=Input/Textarea/Select variants), they are formsConstructor variants
3. Use `get_metadata` or `get_context_for_code_connect` on one of the matched
   components to inspect its parent structure if unclear

**If formsConstructor pattern detected:**
- `formsConstructorKey` = the parent component set's key
- Each input type gets `formsConstructorVariant` (e.g., "Input", "Textarea", "Select")

**If no formsConstructor pattern (all standalone):**
- `formsConstructorKey` = the key of the most common input component
- Input types get `standalone: true` with individual `standaloneKey` values

Ask the user to confirm:

> "It looks like your input components [are variants of one component set / are
> separate standalone components]. Is that right?"

### Step 6: Variant Properties for Standalone Components

For each standalone component (checkbox, radio, switch, etc.), the componentMap
needs `variantProps` — the default variant property values.

Ask the user:

> "For your [Checkbox] component, what variant properties should I use?
> Common examples: Type=Checkbox, State=Default, Checked=False
>
> If you're not sure, I can inspect the component to find its variants."

If the user says "inspect it", use `get_context_for_code_connect` on the component
to discover its variant properties. Present the available variants and let the user
pick the default state.

### Step 7: Text Layer Names

Ask the user what text layers their components use:

> "What are the text layer names inside your form components?"

Provide common defaults:

| Purpose | Common names |
|---------|-------------|
| Field label | "Label", "Header", "Title" |
| Placeholder | "Placeholder", "Hint text" |
| Helper text | "Helper text", "Description", "Support text" |

Options:
- A) Use defaults: Label="Header", Placeholder="Placeholder", HelperText="Helper text"
- B) Let me specify custom names
- C) Inspect a component to find the layer names

If C: use `get_metadata` on one of the input components to find text layers
and present them for the user to identify.

### Step 8: Generate ComponentMap JSON

Assemble the complete componentMap JSON:

```json
{
  "formsConstructorKey": "<detected or provided key>",
  "formHelperTextKey": "<helper text key if found, omit if not>",
  "buttonKey": "<button component key>",
  "fields": {
    "text": { "formsConstructorVariant": "Input" },
    "email": { "formsConstructorVariant": "Input" },
    "phone": { "formsConstructorVariant": "Input" },
    "number": { "formsConstructorVariant": "Input" },
    "password": { "formsConstructorVariant": "Input" },
    "textarea": { "formsConstructorVariant": "Textarea" },
    "select": { "formsConstructorVariant": "Select" },
    "multiselect": { "formsConstructorVariant": "Select" },
    "checkbox": {
      "standalone": true,
      "standaloneKey": "<key>",
      "variantProps": { ... }
    },
    "radio": {
      "standalone": true,
      "standaloneKey": "<key>",
      "variantProps": { ... }
    },
    "switch": {
      "standalone": true,
      "standaloneKey": "<key>",
      "variantProps": { ... }
    },
    "file": { "standalone": true, "missing": true },
    "date": { "standalone": true, "missing": true }
  },
  "textLayerNames": {
    "label": "<detected name>",
    "placeholder": "<detected name>",
    "helperText": "<detected name>"
  }
}
```

Present the JSON and ask:

> "Here's your componentMap. Paste this into the Formhaus Figma plugin's
> Component Map tab to connect your design system."

Options:
- A) Looks good, copy and done
- B) Make changes (specify what)
- C) Save to a file

If B: apply changes and re-present.
If C: write to `packages/figma/src/component-map.custom.json` or a user-specified path.

## Rules

- NEVER output invalid JSON. Validate before presenting.
- NEVER proceed without confirming MCP connection first.
- NEVER guess component keys. Every key must come from Figma MCP search results
  or a user-provided URL.
- Missing components are OK. Mark them `{ "standalone": true, "missing": true }`.
- The `formsConstructorKey` and `buttonKey` fields are REQUIRED. If not found,
  stop and ask the user to provide them.
- All field types in the FieldType union MUST be present in the `fields` object,
  even if marked as missing.
- ONE question at a time via AskUserQuestion. Never batch multiple decisions.
- Show screenshots when available — visual confirmation prevents wrong mappings.

## Example Output

For reference, see the example componentMap at:
`packages/figma/src/component-map.example.json`

This shows the expected structure with both formsConstructor variants (text, email,
textarea, select) and standalone components (checkbox, radio, switch) with variantProps.

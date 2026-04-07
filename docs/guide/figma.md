# Figma Plugin

The Formhaus Figma plugin renders form mockups from form definitions using your design system components.

## Install

1. Open the `packages/figma` folder in the repo
2. In Figma, go to **Plugins > Development > Import plugin from manifest**
3. Select `packages/figma/manifest.json`
4. The plugin appears under **Plugins > Development > Formhaus**

::: tip Building from source
```bash
cd packages/figma
pnpm build
```
This compiles `code.ts` into the bundled plugin code that Figma runs.
:::

## Usage

1. Open a Figma file
2. Run the plugin (**Plugins > Formhaus**)
3. Paste a `@formhaus/core` form definition into the **Generate** tab
4. Click **Generate**

The plugin creates a frame for each step (or one frame for single-step forms) with your design system components rendered inside.

### Quick test

Click **Load example** in the plugin to load a basic contact form definition. Hit **Generate** to see it render with the default component map.

## Component Map

The **Component Map** tells the plugin which Figma components to use for each form field type.

::: tip Auto-generate with Claude
Instead of editing this JSON manually, run [`/formhaus-figma-connect`](/guide/formhaus-figma-connect) to scan your design system and generate the component map automatically.
:::

### Structure

```json
{
  "formsConstructorKey": "COMPONENT_SET_KEY",
  "formHelperTextKey": "HELPER_TEXT_KEY",
  "buttonKey": "BUTTON_KEY",
  "fields": {
    "text": { "formsConstructorVariant": "Input" },
    "email": { "formsConstructorVariant": "Input" },
    "textarea": { "formsConstructorVariant": "Textarea" },
    "select": { "formsConstructorVariant": "Select" },
    "checkbox": {
      "standalone": true,
      "standaloneKey": "CHECKBOX_KEY",
      "variantProps": { "Type": "Checkbox", "State": "Static" }
    }
  },
  "textLayerNames": {
    "label": "Header",
    "placeholder": "Placeholder",
    "helperText": "Helper text"
  }
}
```

### Key concepts

| Field | Description |
|-------|-------------|
| `formsConstructorKey` | Key of the main component set that contains Input, Textarea, and Select as variants |
| `formHelperTextKey` | Key of a helper text component (optional) |
| `buttonKey` | Key of the button component set |
| `fields` | Maps each [field type](/guide/fields) to a component |
| `textLayerNames` | Names of text layers inside your components (for labels, placeholders, helper text) |

### 2 types of field mappings

**formsConstructor variants**, fields that are variants within a single component set:

```json
"text": { "formsConstructorVariant": "Input" }
```

The plugin finds the variant named "Input" inside the `formsConstructorKey` component set.

**Standalone components**, fields that use their own separate component:

```json
"checkbox": {
  "standalone": true,
  "standaloneKey": "YOUR_COMPONENT_KEY",
  "variantProps": { "Type": "Checkbox", "State": "Static", "Checked": "False" }
}
```

The plugin imports the component by `standaloneKey` and applies `variantProps` to select the right variant.

### Finding component keys

To find a component key in Figma:

1. Right-click a component in Figma
2. **Copy/Paste > Copy link**
3. The key is in the URL, or use the Plugin API: `figma.currentPage.selection[0].key`

### Configuring in the plugin

1. Open the plugin and switch to the **Component Map** tab
2. Click **Load Current** to see the active map
3. Edit the JSON to match your design system
4. Click **Save Map** to persist (stored in Figma's local storage)
5. Use **Reset to Default** to go back to the example map

### Missing components

If your design system doesn't have a component for a field type (e.g., file upload or date picker), mark it as missing:

```json
"file": { "standalone": true, "missing": true },
"date": { "standalone": true, "missing": true }
```

Missing fields render as red placeholder frames in the generated output.

## What the plugin generates

For each form, the plugin creates:

- A card frame (400px wide, white background, auto-layout)
- Field components arranged vertically with proper labels, placeholders, and helper text
- Submit/cancel/back buttons at the bottom
- For multi-step forms: one card per step, arranged horizontally

The output uses instances of your design system components.

::: info Customizable layout coming soon
The card width (400px), padding, and spacing are currently fixed. Future versions will make these configurable so you can match your design system's layout grid.
:::

## Next steps

- [/formhaus-create-form](/guide/formhaus-create-form): generate form definitions from text descriptions
- [/formhaus-figma-connect](/guide/formhaus-figma-connect): auto-detect your design system components
- [Field Types](/guide/fields): all supported form field types
- [Examples](/guide/examples): example definitions to try with the plugin

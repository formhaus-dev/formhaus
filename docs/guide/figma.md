# Figma Plugin

The Formhaus Figma plugin renders form mockups from form definitions, with a built-in Material 3 or iOS-like kit, or with your own design system components.

## Install

1. Clone the repo and install dependencies
2. Build the plugin

```bash
pnpm install
pnpm --filter @formhaus/figma build
```

3. In Figma, go to **Plugins > Development > Import plugin from manifest**
4. Select `packages/figma/manifest.json`
5. The plugin appears under **Plugins > Development > Formhaus**

The build bundles the plugin code and its UI into `packages/figma/dist`.

## Usage

1. Open a Figma file
2. Run the plugin (**Plugins > Formhaus**)
3. Paste a `@formhaus/core` form definition into the **Generate** tab
4. Click **Generate**

The plugin creates a frame for each step (or one frame for single-step forms). Regenerating the same definition replaces its frames in place.

### Quick test

Click **Load example** in the plugin to load a basic contact form definition, then **Generate**.

## Built-in kit

Pick **Built-in kit** under **Components** and choose **Material 3** or **iOS-like**. On first use the plugin adds a `Formhaus · <kit>` section to the current page with one component per field role: text, select, textarea, date, file, checkbox, switch, radio and checkbox option rows, primary and secondary buttons. Forms are built from instances of these components, so restyling a kit component updates every generated form. The kit stays in the file and is reused on the next run.

Each kit component exposes `Label`, `Value` and `Helper` text properties and a `Show helper` toggle. Icons come from [Material Symbols](https://fonts.google.com/icons) (Apache 2.0). Material 3 uses Roboto; iOS-like uses SF Pro when it is installed. Both fall back to Inter. Text inputs have `Empty` and `Filled` variants: Material shows only the label in an empty field, iOS-like shows the placeholder inside the cell.

## My components

Open the **Components** tab to render forms with your own design system. Each field role has a row with a preview of the bound component.

1. Select a component, a component set or an instance on the canvas.
2. Click **Use selection** on the role it should render.
3. Pick which text layers or properties hold the label, value and helper text if the detected ones are wrong.

Binding an instance keeps its variant and boolean property values, so configure the instance the way fields should look before binding it. Library components are bound by key and imported when you generate. **Auto-match from this page** binds unbound roles to components on the current page by name, such as `Text field`, `Dropdown`, `Toggle` or `Button / Primary`. Roles you leave unbound use the selected built-in kit.

Bindings are stored in the document, so everyone who opens the file generates with the same components.

## Component Map

The **JSON map** tab is the older way to use your own components: a JSON file that maps each form field type to a component key in your library. The plugin uses it when **My components** is selected and no roles are bound in the **Components** tab.

::: tip Auto-generate with Claude
Run [`/formhaus-figma-connect`](/guide/formhaus-figma-connect) to search your Figma library and build the component map from confirmed matches.
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

1. Open the plugin and switch to the **JSON map** tab
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
- [/formhaus-figma-connect](/guide/formhaus-figma-connect): map components from your Figma library
- [Field Types](/guide/fields): all supported form field types
- [Examples](/guide/examples): example definitions to try with the plugin

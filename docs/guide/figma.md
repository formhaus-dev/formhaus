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

1. Open a Figma file and run the plugin (**Plugins > Formhaus**).
2. On the **Form** tab, pick the components to render with: a built-in kit or **My components**.
3. Build the form in **Fields**: set the title and submit label, add fields, mark them required, and open a field's details for its placeholder, helper text, key and options. Drag fields by the handle to reorder them, or split the form into steps. **JSON** shows the same definition as `@formhaus/core` JSON.
4. Click **Generate form**.

Each generated form keeps its definition. Select a form on the canvas and the plugin opens it for editing. **Update form** redraws it in place with the current components, so anyone with edit access to the file can change a form without touching JSON. Field keys follow the label until another field's condition or route refers to them, and the editor keeps conditions, routes and validation rules it does not show.

### Quick test

Click **Load example** in the plugin to load a basic contact form definition, then **Generate**.

## Built-in kit

Pick **Built-in kit** under **Components** and choose **Material 3** or **iOS-like**. On first use the plugin adds a `Formhaus · <kit>` section to the current page with one component per field role: text, select, textarea, date, file, checkbox, switch, radio and checkbox option rows, primary and secondary buttons. Forms are built from instances of these components, so restyling a kit component updates every generated form. The kit stays in the file and is reused on the next run.

Each kit component exposes `Label`, `Value` and `Helper` text properties and a `Show helper` toggle. Icons come from [Material Symbols](https://fonts.google.com/icons) (Apache 2.0). Material 3 uses Roboto; iOS-like uses SF Pro when it is installed. Both fall back to Inter. Text inputs have `Empty` and `Filled` variants: Material shows only the label in an empty field, iOS-like shows the placeholder inside the cell.

## My components

Open the **Components** tab to render forms with your own design system. Every field role has a card with a preview of the component it renders with.

1. Select a component, a component set or an instance on the canvas. The bar at the top shows it and suggests a role.
2. Drag the bar onto a card, click the card, or click **Bind as …**.
3. If the label, value or helper land in the wrong layers, open **Text slots** on the card and pick the right ones.

Binding an instance keeps its variant and boolean property values, so configure the instance the way fields should look before binding it. Library components are bound by key and imported when you generate. **Auto-match** binds unbound roles to components on the current page by name, such as `Text field`, `Dropdown`, `Toggle` or `Button / Primary`.

Roles you leave unbound reuse a related component when one is bound: a date or select field uses your dropdown or text field, a text area uses your text field. Anything else falls back to the selected built-in kit. With your own components the form card is neutral and takes its font and group label style from your text field.

Drag any card onto the canvas to place that component. Bindings are stored in the document, so everyone who opens the file generates with the same components.

::: tip Bind with Claude
Run [`/formhaus-figma-connect`](/guide/formhaus-figma-connect) to find your form components through the Figma MCP server, confirm them from screenshots and write the bindings into your file.
:::

Earlier versions used a JSON component map. If you saved one, the plugin moves it into **Components** the first time you open a file without bindings.

## What the plugin generates

For each form, the plugin creates:

- A card frame per step, 400px wide with auto-layout. Multi-step forms place the steps side by side.
- Instances of the bound or kit components for every field, with labels, placeholders and helper text filled in.
- An actions group with Submit, Continue, Back and Cancel buttons.

Built-in kits use their own card styling. With your own components the card is white and takes its font and group label style from your text field. Each frame stores the form definition, so you can select it later and edit it from the plugin.

## Next steps

- [/formhaus-create-form](/guide/formhaus-create-form): generate form definitions from text descriptions
- [/formhaus-figma-connect](/guide/formhaus-figma-connect): bind components from your Figma library
- [Field Types](/guide/fields): all supported form field types
- [Examples](/guide/examples): example definitions to try with the plugin

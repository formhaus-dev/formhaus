# @formhaus/figma

Figma plugin that turns a [Formhaus](https://github.com/ignsm/formhaus) definition into component instances on the canvas. It ships Material 3 and iOS-like kits that it generates into your file, or renders with your own components bound in the plugin.

Not published to the Figma Community yet. Install as a local plugin.

## Install (local plugin)

1. Clone the repo: `git clone https://github.com/ignsm/formhaus.git`
2. Build the plugin: `cd formhaus && pnpm install && pnpm --filter @formhaus/figma build`
3. In Figma desktop: **Plugins → Development → Import plugin from manifest...**
4. Pick `packages/figma/manifest.json`

## Usage

1. Open a Figma file
2. **Plugins → Development → Formhaus**
3. Under **Components**, pick a built-in kit (Material 3 or iOS-like) or **My components**. Bind your components in the **Components** tab: select one on the canvas and click **Use selection** next to its role.
4. Paste a Formhaus form definition JSON and click **Generate**

The plugin creates one frame per step and lays the frames out horizontally. With a built-in kit it first adds a `Formhaus · <kit>` section with the kit components to the current page.

`pnpm --filter @formhaus/figma build:harness` builds `dist/harness.js`, which exposes `formhaus.render(definition, kit, useBindings)` and `formhaus.binding(message)` for running the renderer in a file through the Figma MCP `use_figma` tool.

## Component map

Before the **Components** tab, the plugin bound components through a JSON component map. It still works from the **JSON map** tab. The plugin ships with a default component map. To make it use your own design system, you need a JSON that maps each form field type (`text`, `select`, `checkbox`, etc.) to a Figma component key in your library.

The [`/formhaus-figma-connect`](https://formhaus.dev/guide/formhaus-figma-connect.html) Claude skill searches a Figma library through MCP and asks you to confirm the matches. Paste its JSON into the plugin's **JSON map** tab and save it. The plugin stores the map in Figma client storage.

The `ComponentMap` TypeScript interface lives in [`packages/figma/src/constants.ts`](https://github.com/ignsm/formhaus/blob/main/packages/figma/src/constants.ts) if you prefer to write the JSON by hand.

## Docs

- Full Formhaus guide: https://formhaus.dev
- Plugin guide: https://formhaus.dev/guide/figma.html
- Source and issues: https://github.com/ignsm/formhaus

## License

MIT. Kit icons are from [Material Symbols](https://github.com/google/material-design-icons) (Apache 2.0).

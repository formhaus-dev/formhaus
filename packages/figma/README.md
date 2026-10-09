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

## Binding with Claude

The [`/formhaus-figma-connect`](https://formhaus.dev/guide/formhaus-figma-connect.html) Claude skill finds your form components through the Figma MCP server, asks you to confirm them and writes the bindings into the file. A JSON component map saved by an earlier version of the plugin moves into the **Components** tab automatically.

## Docs

- Full Formhaus guide: https://formhaus.dev
- Plugin guide: https://formhaus.dev/guide/figma.html
- Source and issues: https://github.com/ignsm/formhaus

## License

MIT. Kit icons are from [Material Symbols](https://github.com/google/material-design-icons) (Apache 2.0).

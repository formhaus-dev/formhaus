# @formhaus/figma

Figma plugin that generates styled form mockups on the canvas from a [Formhaus](https://github.com/ignsm/formhaus) form definition. Maps your design system components to field types via a `componentMap`.

Not published to the Figma Community yet. Install as a local plugin.

## Install (local plugin)

1. Clone the repo: `git clone https://github.com/ignsm/formhaus.git`
2. Build the plugin: `cd formhaus && pnpm install && pnpm --filter @formhaus/figma build`
3. In Figma desktop: **Plugins → Development → Import plugin from manifest...**
4. Pick `packages/figma/manifest.json`

## Usage

1. Open a Figma file
2. **Plugins → Development → Formhaus**
3. Paste a Formhaus form definition JSON into the plugin UI
4. Click **Generate**

The plugin creates a frame per step with all fields rendered as instances of your mapped design system components. Buttons, step counters, and layout are set up automatically.

## Component map

The plugin ships with a default component map. To make it use your own design system, you need a JSON that maps each form field type (`text`, `select`, `checkbox`, etc.) to a Figma component key in your library.

Writing that map by hand means digging through the Figma API for component keys. Instead, use the **[`/formhaus-figma-connect`](https://formhaus.dev/guide/formhaus-figma-connect.html) Claude skill**: it scans your Figma design system via MCP, auto-detects form components, shows screenshots for confirmation, and generates the full `componentMap` JSON. Copy the output, open the plugin's **Component Map** tab, paste, save. The plugin remembers the map across runs.

If you don't use Claude Code, the full `ComponentMap` TypeScript interface lives in [`packages/figma/src/constants.ts`](https://github.com/ignsm/formhaus/blob/main/packages/figma/src/constants.ts). Paste a JSON that conforms to it.

## Docs

- Full Formhaus guide: https://formhaus.dev
- Plugin guide: https://formhaus.dev/guide/figma.html
- Source and issues: https://github.com/ignsm/formhaus

## License

MIT

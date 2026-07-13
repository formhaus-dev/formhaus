# @formhaus/figma

Figma plugin that turns a [Formhaus](https://github.com/ignsm/formhaus) definition into component instances on the canvas. A `componentMap` connects field types to components from your library.

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

The plugin creates one frame per step, adds mapped field and button instances, and lays the frames out horizontally.

## Component map

The plugin ships with a default component map. To make it use your own design system, you need a JSON that maps each form field type (`text`, `select`, `checkbox`, etc.) to a Figma component key in your library.

The [`/formhaus-figma-connect`](https://formhaus.dev/guide/formhaus-figma-connect.html) Claude skill searches a Figma library through MCP and asks you to confirm the matches. Paste its JSON into the plugin's **Component Map** tab and save it. The plugin stores the map in Figma client storage.

The `ComponentMap` TypeScript interface lives in [`packages/figma/src/constants.ts`](https://github.com/ignsm/formhaus/blob/main/packages/figma/src/constants.ts) if you prefer to write the JSON by hand.

## Docs

- Full Formhaus guide: https://formhaus.dev
- Plugin guide: https://formhaus.dev/guide/figma.html
- Source and issues: https://github.com/ignsm/formhaus

## License

MIT

# @formhaus/figma

Figma plugin that draws [Formhaus](https://github.com/ignsm/formhaus) form definitions as editable mockups, with a built-in Material 3 or iOS-like kit or with your own design system components.

![The Formhaus plugin editing a branching form next to its flow map](../../docs/public/figma/hero.png)

## Install (local plugin)

Not published to the Figma Community yet. Install it as a local plugin.


1. Clone the repo: `git clone https://github.com/ignsm/formhaus.git`
2. Build the plugin: `cd formhaus && pnpm install && pnpm --filter @formhaus/figma build`
3. In Figma desktop: **Plugins → Development → Import plugin from manifest...**
4. Pick `packages/figma/manifest.json`

## Usage

1. Run **Plugins → Development → Formhaus**.
2. On **Form**, pick a built-in kit or **My components**. Bind your own components on the **Components** tab.
3. Build the form in the editor or paste JSON, then click **Generate form**.
4. Select a generated form later to edit it and click **Update form**.

Multi-step forms with routes get a flow map with labelled arrows, and every multi-step form is wired as a clickable prototype. **Steps** switches between separate screens and one page.

<img src="../../docs/public/figma/prototype.gif" alt="Clicking through a generated prototype" width="560">

`pnpm --filter @formhaus/figma build:harness` builds `dist/harness.js`, which exposes `formhaus.render(definition, kit, useBindings, layout)` and `formhaus.binding(message)` for running the renderer through the Figma MCP `use_figma` tool.

## Binding with Claude

The [`/formhaus:formhaus-figma-connect`](https://formhaus.dev/guide/formhaus-figma-connect.html) Claude skill finds your form components through the Figma MCP server, asks you to confirm them and writes the bindings into the file. Save a setup as a design system to reuse it in every file and share it with a setup code.

## Docs

- Plugin guide: https://formhaus.dev/guide/figma.html
- Community listing and publishing checklist: [community/listing.md](community/listing.md)
- Source and issues: https://github.com/ignsm/formhaus

## License

MIT. Kit icons are from [Material Symbols](https://github.com/google/material-design-icons) (Apache 2.0).

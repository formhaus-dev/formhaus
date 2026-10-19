# @formhaus/figma

Figma plugin that draws [Formhaus](https://github.com/formhaus-dev/formhaus) form definitions as editable mockups, with a built-in Material 3 or iOS-like kit or with your own design system components.

![The Formhaus plugin editing a branching form next to its flow map](../../docs/public/figma/hero.png)

## Install (local plugin)

Not published to the Figma Community yet. Install it as a local plugin.


1. Clone the repo: `git clone https://github.com/formhaus-dev/formhaus.git`
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

## Publishing to Figma Community

Publishing needs the Figma desktop app and two-factor authentication on the publishing account. Listing texts are in [community/listing.md](community/listing.md).

1. Build: `pnpm --filter @formhaus/figma build`, then import `manifest.json` in Figma desktop as described above.
2. Open a file, click the Figma logo, then **Plugins → Manage plugins**. Open the menu next to Formhaus and select **Publish**.
3. `manifest.json` has the placeholder id `formhaus`. In the publish dialog, click **Generate ID**, replace `"id"` in `manifest.json` with the new id, rebuild and commit. Later updates must keep this id.
4. **Describe your resource:** name, tagline, description and category.
5. **Choose some images:** icon `community/icon.png` (128×128) and thumbnail `community/cover.png`. Figma recommends 1920×1080 for the thumbnail; the current cover is 1920×960. Add up to nine carousel images, such as `docs/public/figma/prototype.gif`.
6. **Data security** (optional): fill in the disclosure from the "Data and network" section of the listing. Figma reviews it separately, which can take up to two weeks.
7. **Add the final details:** set the support contact to the issues link and check the network access label, which comes from `networkAccess` in `manifest.json`.
8. Click **Publish**. The plugin shows an "In review" badge until Figma approves or rejects it, and Figma sends the result by email. Review time is not fixed.

Unverified: whether the dialog has a separate tags field. Figma's help article lists only a category.

## Binding with Claude

The [`/formhaus:formhaus-figma-connect`](https://formhaus.dev/guide/formhaus-figma-connect.html) Claude skill finds your form components through the Figma MCP server, asks you to confirm them and writes the bindings into the file. Save a setup as a design system to reuse it in every file and share it with a setup code.

## Docs

- Plugin guide: https://formhaus.dev/guide/figma.html
- Community listing and publishing checklist: [community/listing.md](community/listing.md)
- Source and issues: https://github.com/formhaus-dev/formhaus

## License

MIT. Kit icons are from [Material Symbols](https://github.com/google/material-design-icons) (Apache 2.0).

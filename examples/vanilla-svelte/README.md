# Svelte example (no adapter package)

This example uses `@formhaus/core` directly from Svelte. The component subscribes to `FormEngine` and copies engine state into Svelte variables after each update.

## Run

This example installs its own dependencies (it ignores the workspace root):

```bash
pnpm install --ignore-workspace
pnpm dev
```

Opens at http://localhost:5173.

## Files

- [src/App.svelte](src/App.svelte) subscribes through `engine.subscribe(...)`, updates reactive variables in `sync()`, and renders fields by `field.type`.
- [src/definition.json](src/definition.json) uses the same definition format as the React and Vue examples.

## Use as a starter

Copy this folder, rename, and tweak `definition.json` and the renderer logic. Add support for whichever field types your app needs.

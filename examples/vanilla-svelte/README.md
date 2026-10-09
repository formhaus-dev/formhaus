# Svelte example (no adapter package)

This example uses `@formhaus/core` directly from Svelte. The component subscribes to `FormEngine` and copies engine state into Svelte variables after each update.

## Run

This example is its own pnpm workspace and installs `@formhaus/*` from npm:

```bash
pnpm install
pnpm dev
```

Opens at http://localhost:5173.

## Files

- [src/App.svelte](src/App.svelte) subscribes through `engine.subscribe(...)`, updates reactive variables in `sync()`, and renders fields by `field.type`.
- [src/definition.json](src/definition.json) uses the same definition format as the React and Vue examples.

## Use as a starter

Copy this folder, rename, and tweak `definition.json` and the renderer logic. Add support for whichever field types your app needs.

# Svelte example (no adapter package)

Demonstrates that `@formhaus/core` works directly with any framework — no `@formhaus/svelte` package needed. The Svelte component subscribes to the `FormEngine` and re-renders on change.

## Run

This example installs its own dependencies (it ignores the workspace root):

```bash
pnpm install --ignore-workspace
pnpm dev
```

Opens at http://localhost:5173.

## What's interesting

- [src/App.svelte](src/App.svelte) — subscribes to `engine.subscribe(...)`, copies state into reactive `let` variables in `sync()`, and renders fields by `field.type`. This is the pattern you'd use to write `@formhaus/svelte` if you wanted one.
- [src/definition.json](src/definition.json) — same form definition format as the React/Vue examples. Define once, render anywhere.

## Use as a starter

Copy this folder, rename, and tweak `definition.json` and the renderer logic. Add support for whichever field types your app needs.

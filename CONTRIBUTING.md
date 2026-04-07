# Contributing

Thanks for wanting to help. Here's how to get started.

## Setup

```bash
git clone https://github.com/ignsm/formhaus.git
cd formhaus
pnpm install
```

## Project structure

```
packages/
  core/     # form engine, types, validation, visibility (zero deps)
  react/    # React adapter (depends on core)
  vue/      # Vue 3 adapter (depends on core)
  figma/    # Figma plugin (depends on core)
docs/       # VitePress site at formhaus.dev
```

`core` is the heart. It has no framework dependencies. React and Vue are thin adapters that connect the engine to framework reactivity and render native HTML by default.

## Build and test

```bash
pnpm build    # build all packages
pnpm test     # test all packages (core + figma + react + vue)
```

CI runs on every PR — build + test must pass.

## Run docs locally

```bash
cd docs
pnpm install
pnpm dev
```

Opens at http://localhost:5173.

## Making changes

1. Fork the repo and create a branch from `main`
2. Make your changes
3. Make sure `pnpm build` and `pnpm test` pass
4. Update docs if you changed any public API
5. Add a changelog entry under `## Unreleased`
6. Commit using [conventional commits](https://www.conventionalcommits.org/) (`feat:`, `fix:`, `docs:`, `chore:`)
7. Open a PR against `main`

## What could use help

- Svelte adapter (`@formhaus/svelte`)
- More fixture definitions in `packages/core/fixtures/`
- Bug reports

### Docs wanted

- **Why Formhaus** — comparison page vs react-hook-form, Formik, VeeValidate. One form definition renders to React, Vue, Svelte, and Figma. Nobody else does that.
- **Migration guides** — "Coming from react-hook-form" / "Coming from Formik". Map their concepts to ours.
- **TypeScript** — how to type definitions, infer value types, generics in custom components.
- **Recipes** — dependent dropdowns, address autocomplete, file upload, dynamic field arrays. Concrete solutions, not abstract docs.
- **Design system integration** — examples with shadcn/ui, Vuetify, Ant Design. One real UI kit example beats ten abstract ones.

### Schema improvements (non-urgent)

- **`disabled` on fields** — currently only action buttons support `disabled`. Sometimes you need to show a field but block input.
- **`readonly`** — useful for review/preview mode where the form is visible but not editable.
- **Multiple validators per field** — right now it's `"validator": "checkFormat"`. An array like `["checkFormat", "checkUnique"]` would be more flexible.
- **`optionsFrom` / `optionsDependsOn` docs** — the feature works but there's no usage example in the docs. This is the most "magical" part of the definition format.
- **Field groups / sections** — if a single step has 15 fields, you want to visually break them into blocks without going multi-step.

## Code style

- TypeScript everywhere
- No runtime dependencies in `core`
- No comments in code — code should be self-explanatory
- Adapters render native HTML by default, users bring their own UI kit via `components` prop
- Both React and Vue ship unstyled — no CSS included
- CSS class prefix: `fh-` (consistent across frameworks)
- `FieldType` is extensible — custom types via `components` prop

## Questions?

Open an issue. No question is too small.

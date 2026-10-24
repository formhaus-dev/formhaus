# Contributing

Thanks for wanting to help. Here's how to get started.

## Setup

```bash
git clone https://github.com/formhaus-dev/formhaus.git
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

CI runs on pushes to `main` and on PRs targeting `main`; build and test must pass. A stacked PR based on another branch gets no CI until it is retargeted to `main`.

PR checks stay fast and deterministic: tests count reads, renders and calls, never seconds. Long runs live outside PR CI:

- `pnpm fuzz`: the core property suites at full size (500 lifecycle runs per form, 2000 model runs, 3000 path runs). PR CI runs 50, 200 and 300. `FORMHAUS_FUZZ_SEED` replays a lifecycle seed.
- `pnpm test:engines`: the editor layout tests in Chromium, Firefox and WebKit. PR CI runs them in Chromium only. Needs `pnpm --filter @formhaus/editor-react exec playwright install chromium firefox webkit`.
- `pnpm bench`: times `validateSubmission` and `checkDefinition` on oversized input (100,000 group items, 250,000-item lists, 120,000-character patterns). It prints a table and asserts nothing.

The Full checks workflow runs all three every night and on demand from GitHub Actions. It also runs the full build, checks and tests on Node 22.12, and the React and Vue tests against the lowest supported peers (React 18.0.0, Vue 3.3.3). PR CI runs the same lowest-peer tests, then the React tests on React 18.3.1, when core, react or vue change.

Before a release, run `pnpm build && pnpm test:release`, or start the Full checks workflow and wait for it to pass.

## Run docs locally

```bash
cd docs
pnpm install
pnpm dev
```

Opens at http://localhost:5173.

## Bundle size

`FormEngine` is at 17.4 of 19 KB gzipped. Anything not needed to run a form goes into a subpath entry or a renderer, not into the engine.

- `pnpm size` measures every entry in `scripts/bundle-entries.json` and prints the gzipped size of each. CI does not fail on size; `pnpm check:size-docs` keeps the table in `docs/guide/bundle-size.md` in sync with the build.
- `pnpm size:docs` rewrites the size tables in the docs. CI fails when a cell is more than 0.5 KB off.
- `pnpm size:compare` installs the other libraries from npm and updates their table in [Bundle size](docs/guide/bundle-size.md). CI does not run it.

## Making changes

1. Fork the repo and create a branch from `main`
2. Make your changes
3. Make sure `pnpm build` and `pnpm test` pass
4. Update docs if you changed any public API
5. Run `pnpm changeset` and pick the affected packages + bump type. This writes a `.changeset/*.md` file describing your change. Commit it with the rest of your work.
6. Commit using [conventional commits](https://www.conventionalcommits.org/) (`feat:`, `fix:`, `docs:`, `chore:`)
7. Open a PR against `main`

### Changesets

Releases are managed with [Changesets](https://github.com/changesets/changesets). Each PR that touches a published package adds a `.changeset/*.md` file. When the maintainer is ready to release, `pnpm version` consumes those files into per-package CHANGELOGs, bumps versions and syncs `packages/mcp/server.json`; the Release workflow (run by hand from GitHub Actions, approved in the `npm` environment) builds, publishes to npm through trusted publishing with provenance, pushes the git tags, publishes `server.json` to the MCP Registry and opens a PR that moves the docs site and playground to the new version; to do it by hand, run `node scripts/bump-docs-pins.mjs <version>` and `pnpm --dir docs install`.

Don't edit per-package `CHANGELOG.md` files by hand — they're generated.

`@formhaus/core`, `@formhaus/react` and `@formhaus/vue` are versioned together (the `fixed` group in `.changeset/config.json`). `@formhaus/mcp` and the `formhaus` CLI have their own versions. `@formhaus/figma` is private and not published.

### Public API snapshot

`api/*.api.md` holds the public types of every published entry of `@formhaus/core`, `@formhaus/react` and `@formhaus/vue`, except `@formhaus/core/internal`. CI runs `pnpm api:check` after the build and fails when the built `.d.ts` files differ from the snapshot. If the change is intended, run `pnpm build && pnpm api:update` and commit the updated files. A removed or changed line in the diff is a breaking change: after 1.0 it needs a major release.

## What could use help

- Svelte adapter (`@formhaus/svelte`)
- More form definitions in `examples/definitions/`
- Bug reports

### Docs wanted

- **Why Formhaus** — comparison page for teams considering react-hook-form, Formik, or VeeValidate.
- **Migration guides** — "Coming from react-hook-form" / "Coming from Formik". Map their concepts to ours.
- **TypeScript** — how to type definitions, infer value types, generics in custom components.
- **Recipes** — dependent dropdowns, address autocomplete, file upload, dynamic field arrays. Concrete solutions, not abstract docs.
- **Design system integration** — examples with shadcn/ui, Vuetify, and Ant Design.

### Schema improvements (non-urgent)

- **`disabled` on fields** — currently only action buttons support `disabled`. Sometimes you need to show a field but block input.
- **`readonly`** — useful for review/preview mode where the form is visible but not editable.
- **Multiple validators per field** — right now it's `"validator": "checkFormat"`. An array like `["checkFormat", "checkUnique"]` would be more flexible.
- **Field groups / sections** — if a single step has 15 fields, you want to visually break them into blocks without going multi-step.

## Site analytics events

formhaus.dev and the docs load a cookieless Umami script from `packages/site-theme/src/analytics.ts`. It sends nothing under Do Not Track or Global Privacy Control. The npm packages send nothing. Event names are kebab-case. Properties stay coarse: never emails, form contents or ids that identify a person.

Add an event with `data-umami-event="<name>"` and `data-umami-event-<prop>` on a link or button, or with `track()` from `@formhaus/site-theme` for copy buttons and async actions. Add it to this list in the same change.

| Event | Fires on | Properties |
|---|---|---|
| `signup-cta-click` | "Create a free form" and pricing buttons | `location`, `period` on pricing |
| `signin-click` | "Sign in" in the nav | `location` |
| `onboarding-open` | "Publish your first form" | `location` |
| `onboarding-choice` | Path picked in the onboarding dialog | `path` |
| `library-cta-click` | "Install the library" | `location` |
| `promo-click` | Promo bar link ("Try the framework", "Try Cloud") | `variant` |
| `outbound-click` | GitHub, GitHub star, npm and mail links | `dest`, `location` |
| `install-copy` | Copy of an install command | `pkg`, `location` |
| `docs-code-copy` | Copy of any other code block in the docs | `lang` |
| `mcp-copy` | Copy of an MCP setup command or agent prompt | `client`, `location` |
| `template-action` | Template page: open in Cloud, copy JSON, copy prompt | `action`, `slug` |
| `template-filter` | Template gallery category | `category` |
| `playground-action` | Playground: library switch, fixture, open in CodeSandbox | `action`, `framework`, `variant`, `fixture` |
| `pricing-period` | Monthly or yearly switch on pricing | `period` |
| `build-open` | Form builder opened | `start` |
| `build-launch` | Builder draft sent to Cloud | `result`, `start` |
| `build-json` | Builder JSON copied or downloaded | `action` |
| `demo-action` | Landing demo: format, copy, reset, restart | `action` |

Page views cover the rest: `/playground`, `/templates/<slug>`, `/guide/`, `/cloud/plans`.

## Code style

- TypeScript everywhere
- No runtime dependencies in `core`
- No comments in code — code should be self-explanatory
- Adapters render native HTML by default, users bring their own UI kit via `components` prop
- React and Vue ship unstyled; the optional baseline stylesheet lives in `@formhaus/core/style.css`
- CSS class prefix: `fh-` (consistent across frameworks)
- `FieldType` is extensible — custom types via `components` prop

## Duplicate code check

`pnpm check:duplicates` runs jscpd over `packages/*/src` (tests and declaration files excluded) and fails when copy-pasted code exceeds `threshold` in `.jscpd.json`, a percentage of total lines. Extract shared code instead of raising it. After removing duplication, lower `threshold` to just above the new value from the report.

## Questions?

Open an issue. No question is too small.

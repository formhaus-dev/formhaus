# Examples

These integrations install their own dependencies and can be copied outside the monorepo.

| Example | Stack | What it shows |
|---------|-------|---------------|
| [`react-mui`](react-mui/) | React 18 + Material UI | `components` prop with MUI Autocomplete, DateTimePicker, Select, etc. |
| [`vue-vuetify`](vue-vuetify/) | Vue 3 + Vuetify 3 | `components` prop with Vuetify `<v-autocomplete>`, `<v-text-field>`, etc. |
| [`vanilla-svelte`](vanilla-svelte/) | Svelte (no adapter) | Using `@formhaus/core` directly without a framework adapter |
| [`react-quiz`](react-quiz/) | React 18, built-in fields | Quiz funnel with auto-advance, routes, lead capture in lifecycle hooks, and funnel events |
| [`nextjs-app-router`](nextjs-app-router/) | Next.js 16 App Router | Definition loaded in a server component, route handler re-validates with `FormEngine` |
| [`nuxt`](nuxt/) | Nuxt 4 | Page with `@formhaus/vue`, server route re-validates with `FormEngine` |
| [`react-shadcn`](react-shadcn/) | Vite + React 19 + shadcn/ui | `components` prop with shadcn Input, Select, Checkbox, RadioGroup, and Button |

## Run any example

```bash
cd examples/<name>
pnpm install
pnpm dev
```

Each example has its own `pnpm-workspace.yaml`, so it resolves `@formhaus/*` from the public npm registry instead of the local packages. The file also allows esbuild's install script, which pnpm 10 and later block by default.

## Form definitions

[`definitions/`](definitions/) contains stand-alone JSON form definitions used by the documentation playground. They're regular `FormDefinition` files; copy any of them into a new project to get started.

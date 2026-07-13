# Examples

These integrations install their own dependencies and can be copied outside the monorepo.

| Example | Stack | What it shows |
|---------|-------|---------------|
| [`react-mui`](react-mui/) | React 18 + Material UI | `components` prop with MUI Autocomplete, DateTimePicker, Select, etc. |
| [`vue-vuetify`](vue-vuetify/) | Vue 3 + Vuetify 3 | `components` prop with Vuetify `<v-autocomplete>`, `<v-text-field>`, etc. |
| [`vanilla-svelte`](vanilla-svelte/) | Svelte (no adapter) | Using `@formhaus/core` directly without a framework adapter |

## Run any example

```bash
cd examples/<name>
pnpm install --ignore-workspace
pnpm dev
```

`--ignore-workspace` makes the example resolve `@formhaus/*` from the public npm registry instead of the local workspace.

## Form definitions

[`definitions/`](definitions/) contains stand-alone JSON form definitions used by the documentation playground. They're regular `FormDefinition` files; copy any of them into a new project to get started.

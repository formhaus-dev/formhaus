# Examples

These integrations install their own dependencies and can be copied outside the monorepo.

| Example | Stack | What it shows |
|---------|-------|---------------|
| [`react-default`](react-default/) | Vite + React 19, built-in fields | `FormRenderer` with the default fields and stylesheet |
| [`react-mui`](react-mui/) | React 18 + Material UI | `components` prop with MUI Autocomplete, Select, TextField, etc. |
| [`react-antd`](react-antd/) | Vite + React 19 + Ant Design 6 | Every field type and layout slot mapped to Ant Design |
| [`react-govuk`](react-govuk/) | Vite + React 19 + govuk-frontend | GOV.UK markup and error summary, written as small React components |
| [`vue-vuetify`](vue-vuetify/) | Vue 3 + Vuetify 3 | `components` prop with Vuetify `<v-autocomplete>`, `<v-text-field>`, etc. |
| [`vanilla-svelte`](vanilla-svelte/) | Svelte (no adapter) | Using `@formhaus/core` directly without a framework adapter |
| [`react-quiz`](react-quiz/) | React 18, built-in fields | Quiz funnel with auto-advance, routes, lead capture in lifecycle hooks, and funnel events |
| [`nextjs-app-router`](nextjs-app-router/) | Next.js 16 App Router | Definition loaded in a server component, route handler re-validates with `validateSubmission()` |
| [`nuxt`](nuxt/) | Nuxt 4 | Page with `@formhaus/vue`, server route re-validates with `validateSubmission()` |
| [`react-shadcn`](react-shadcn/) | Vite + React 19 + shadcn/ui | `components` prop with shadcn Input, Select, Checkbox, RadioGroup, and Button |
| [`react-mantine`](react-mantine/) | Vite + React 19 + Mantine 9 | Every field type and every `layout` slot with Mantine, including `@mantine/dates` |
| [`react-chakra`](react-chakra/) | Vite + React 19 + Chakra UI 3 | Every field type and every `layout` slot with Chakra, including `DatePicker` and `Combobox` |
| [`react-carbon`](react-carbon/) | Vite + React 19 + IBM Carbon | Every field type and every `layout` slot with `@carbon/react`, light and dark themes |
| [`vue-primevue`](vue-primevue/) | Vite + Vue 3 + PrimeVue 4 | Every field type and layout slot with PrimeVue, light and dark Aura theme |
| [`vue-element-plus`](vue-element-plus/) | Vite + Vue 3 + Element Plus | Every field type and layout slot with Element Plus, light and dark |
| [`react-uswds`](react-uswds/) | Vite + React 19 + USWDS | U.S. Web Design System markup and error summary as small React components |
| [`react-flat-api`](react-flat-api/) | React 18, built-in fields | Three steps sent as one flat API request, server errors mapped back to fields on any step |
| [`cloud-waitlist`](cloud-waitlist/) | Plain HTML, React 18 | Formhaus Cloud waitlist form: `embed.js` in a static page and `FormhausForm` in React |

## Run any example

```bash
cd examples/<name>
pnpm install
pnpm dev
```

Each example has its own `pnpm-workspace.yaml` and lockfile, so it resolves `@formhaus/*` from the public npm registry instead of the local packages. The workspace file carries the same install rules as the repo root: a 7-day release age, a build-script allowlist and the trust policy.

## Form definitions

[`definitions/`](definitions/) contains stand-alone JSON form definitions used by the documentation playground. They're regular `FormDefinition` files; copy any of them into a new project to get started.

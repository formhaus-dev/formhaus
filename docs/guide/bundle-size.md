---
title: "Bundle size"
description: "Gzipped bundle sizes of Formhaus and other form libraries for React and Vue, with versions, the measurement method and the command to reproduce."
---

# Bundle size

Gzipped size of the code an app pays for each Formhaus entry and for other form libraries.

## Size at 1.0

<!-- size:apps:start -->

| App imports | Measured |
|---|---|
| Every export of `@formhaus/core` | 28.8 KB |
| Every export of `@formhaus/core` and `@formhaus/react` | 33.3 KB |
| Every export of `@formhaus/core` and `@formhaus/vue` | 37.3 KB |
| `FormEngine` from `@formhaus/core` | 17.8 KB |
| `useFormEngine` from `@formhaus/react`, with core | 18.6 KB |
| `useFormEngine` from `@formhaus/vue`, with core | 18.4 KB |
| `FormRenderer` from `@formhaus/react`, with core | 32.6 KB |
| `FormRenderer` from `@formhaus/vue`, with core | 36.2 KB |
| `FormEngine` from `@formhaus/core`, with `FORMHAUS_TRUSTED` | 14.0 KB |
| `FormRenderer` from `@formhaus/react`, with core and `FORMHAUS_TRUSTED` | 29.1 KB |
| `FormRenderer` from `@formhaus/vue`, with core and `FORMHAUS_TRUSTED` | 32.6 KB |

<!-- size:apps:end -->

## Rendering paths

The entry you import sets the size. React and Vue are not counted.

<!-- size:paths:start -->

| Entry | You write | React | Vue |
|---|---|---|---|
| `FormEngine` | All markup, in any framework. The engine does state, conditions, validation, steps and a basic structure check | 17.8 KB | 17.8 KB |
| `useFormEngine` | All markup. The hook gives the visible fields of the step, values, errors, the current step, `setValue`, `next`, `back` and `submit` | 18.6 KB | 18.4 KB |
| `HeadlessFormRenderer` | A component for each field type, actions and progress. The renderer does steps, field order, conditions, focus and the error summary | 28.8 KB | 30.9 KB |
| `FormRenderer` | Nothing. Built-in fields, actions and progress; replace some types through `components` | 32.6 KB | 36.2 KB |

<!-- size:paths:end -->

These cost the same on any path, and only when imported:

<!-- size:addons:start -->

| Import | Adds |
|---|---|
| `checkDefinition()` with warnings and hints, for an editor, CI or AI generation | 8.0 KB |
| `@formhaus/core/cloud` | 3.3 KB |
| `@formhaus/core/i18n` | 5.9 KB |
| `@formhaus/core/fix` | 11.6 KB |
| `@formhaus/core/research` | 0.3 KB |
| `@formhaus/core/fields` | 1.7 KB |
| `@formhaus/core/schema` | 0.3 KB |
| Engine warnings in development | 0 KB in production |

<!-- size:addons:end -->

[`mapControls`](/guide/design-systems) adds to `FormRenderer` or `HeadlessFormRenderer`:

<!-- size:controls:start -->

| Import | React | Vue |
|---|---|---|
| `mapControls` from `/controls`, over `FormRenderer` | 2.8 KB | 3.0 KB |

<!-- size:controls:end -->

`pnpm size:docs` writes these tables from the build. CI fails when a cell is more than 0.5 KB off. 1 KB is 1024 bytes.

`useFormEngine`: you render everything.

```tsx
const engine = useFormEngine(definition);

return engine.visibleFields.map((field) => (
  <input key={field.key} value={String(engine.values[field.key] ?? '')} onChange={(event) => engine.setValue(field.key, event.target.value)} />
));
```

`HeadlessFormRenderer`: you register a component for each field type.

```tsx
<HeadlessFormRenderer
  definition={definition}
  components={{ text: MyInput, email: MyInput, select: MySelect }}
  layout={{ actions: MyFormActions, progress: MyStepProgress }}
  onSubmit={handleSubmit}
/>
```

`FormRenderer`: the built-in fields, with some types replaced.

```tsx
<FormRenderer definition={definition} components={{ phone: MyPhoneInput }} onSubmit={handleSubmit} />
```

Vue examples and the full props are in [Choose a renderer](/guide/#choose-a-renderer).

## Trusted definitions

Define `process.env.FORMHAUS_TRUSTED` as `"1"` in the bundler to drop the structure check from production builds.

<!-- size:trusted:start -->

| App imports | Checked | Trusted |
|---|---|---|
| `FormEngine` from `@formhaus/core` | 17.8 KB | 14.0 KB |
| `FormRenderer` from `@formhaus/react`, with core | 32.6 KB | 29.1 KB |
| `FormRenderer` from `@formhaus/vue`, with core | 36.2 KB | 32.6 KB |

<!-- size:trusted:end -->

Use it when every definition passed `checkDefinition()` or `parseDefinition()` in CI, or comes from Formhaus Cloud. An invalid definition then fails with a plain runtime error or renders wrong, without a `FormDefinitionError`. Development builds still run `checkDefinition()`. Without the define nothing changes.

In production the engine does not check a definition returned by `parseDefinition()` again. Parse it again after you change it in place. `validateSubmission()` always checks the definition, with or without the define.

Set it only as a build-time define for code that renders your own definitions. Unbundled Node reads `process.env` at runtime, so never set `FORMHAUS_TRUSTED` in a server environment that builds a `FormEngine` from definitions you did not check.

Rollup needs two terser passes to drop the check.

::: code-group

```ts [Vite]
export default defineConfig({
  define: { 'process.env.FORMHAUS_TRUSTED': JSON.stringify('1') },
});
```

```ts [esbuild]
await build({
  define: { 'process.env.FORMHAUS_TRUSTED': JSON.stringify('1') },
});
```

```js [webpack]
plugins: [new webpack.DefinePlugin({ 'process.env.FORMHAUS_TRUSTED': JSON.stringify('1') })],
```

```js [Rollup]
plugins: [
  replace({ preventAssignment: true, values: { 'process.env.FORMHAUS_TRUSTED': JSON.stringify('1') } }),
  terser({ compress: { passes: 2 } }),
],
```

```js [Next.js]
export default { env: { FORMHAUS_TRUSTED: '1' } };
```

```ts [Nuxt]
export default defineNuxtConfig({
  vite: { define: { 'process.env.FORMHAUS_TRUSTED': JSON.stringify('1') } },
});
```

:::

## Other libraries

The same entries next to other form libraries. The second table changes only when `pnpm size:compare` runs.

<!-- size:formhaus:start -->

| Formhaus | gzip | State and validation | Rendering | Multi-step | Same validation on the server | JSON definitions |
|---|---|---|---|---|---|---|
| `@formhaus/core` `FormEngine` only | 17.8 KB | Yes | No | Yes | `validateSubmission()` | Yes |
| `@formhaus/core` + `@formhaus/react` | 33.3 KB | Yes | Yes | Yes | `validateSubmission()` | Yes |
| `@formhaus/core` + `@formhaus/vue` | 37.3 KB | Yes | Yes | Yes | `validateSubmission()` | Yes |

<!-- size:formhaus:end -->

<!-- size:libraries:start -->

| Library | gzip | State and validation | Rendering | Multi-step | Same validation on the server | JSON definitions |
|---|---|---|---|---|---|---|
| react-hook-form 7.90.0 | 11.5 KB | Yes | No | No | With a schema resolver shared with the server | No |
| @tanstack/react-form 1.33.5 | 17.3 KB | Yes | No | No | A Standard Schema validator shared with the server, or `createServerValidate` in the framework adapters | No |
| formik 2.4.9 + yup 1.7.1 | 25.7 KB | Yes | No | No | The Yup schema runs on the server | No |
| @formkit/vue 2.1.2 | 30.1 KB | Yes | Yes | Plugin in `@formkit/addons`, not counted | No | FormKit schema |
| JSON Forms 3.8.0 (`@jsonforms/core` + `@jsonforms/react` + `@jsonforms/vanilla-renderers`) | 82.6 KB | Yes | Yes | Categorization layout, shown as a category list in the vanilla renderers | AJV runs the JSON Schema on the server | JSON Schema and UI schema |
| react-jsonschema-form 6.11.0 (`@rjsf/core` + `@rjsf/validator-ajv8`) | 125.3 KB | Yes | Yes | No | AJV runs the JSON Schema on the server | JSON Schema and UI schema |
| SurveyJS 3.2.1 (`survey-core` + `survey-react-ui`) | 409.3 KB | Yes | Yes | Yes | `onServerValidateQuestions` calls your server check | Yes |

Installed from npm on 2026-10-20: `react-hook-form@7.90.0`, `formik@2.4.9`, `yup@1.7.1`, `@formkit/vue@2.1.2`, `@rjsf/core@6.11.0`, `@rjsf/utils@6.11.0`, `@rjsf/validator-ajv8@6.11.0`, `survey-core@3.2.1`, `survey-react-ui@3.2.1`, `@jsonforms/core@3.8.0`, `@jsonforms/react@3.8.0`, `@jsonforms/vanilla-renderers@3.8.0`, `@tanstack/react-form@1.33.5`. Bundled with esbuild 0.28.2 as in [Method](#method).

<!-- size:libraries:end -->

## Imports

| Library | Entry |
|---|---|
| react-hook-form | `useForm` |
| formik + yup | `useFormik` from `formik`, `object` and `string` from `yup` |
| @formkit/vue | `plugin`, `defaultConfig`, `FormKit` |
| react-jsonschema-form | `Form` from `@rjsf/core`, `validator` from `@rjsf/validator-ajv8` |
| SurveyJS | `Model` from `survey-core`, `Survey` from `survey-react-ui` |
| JSON Forms | `JsonForms` from `@jsonforms/react`, `vanillaRenderers` from `@jsonforms/vanilla-renderers` |
| @tanstack/react-form | `useForm` |
| Formhaus engine | `FormEngine` from `@formhaus/core` |
| Formhaus paths | `useFormEngine`, `HeadlessFormRenderer` or `FormRenderer` from `@formhaus/react` or `@formhaus/vue` |
| Formhaus subpaths | `FormEngine` with `checkDefinition`, or with every export of `/cloud`, `/i18n` or `/fix`, minus `FormEngine` alone |
| Formhaus React | Every export of `@formhaus/react` |
| Formhaus Vue | Every export of `@formhaus/vue` |

## Method

Each entry is bundled with esbuild:

- `bundle`, `minify`, `format: 'esm'`
- `process.env.NODE_ENV` set to `"production"`, and `process.env.FORMHAUS_TRUSTED` set to `"1"` for the trusted entries
- `react`, `react-dom` and `vue` are external
- CSS is not counted
- the output is gzipped at level 9

Dependencies and peer dependencies such as `@rjsf/utils` are in the bundle. `pnpm size:compare` installs the other libraries from npm at the versions above into a temporary directory. Formhaus is built from the repository.

The same method runs in CI in `scripts/check-bundle-size.mjs` and `pnpm check:size-docs`.

## Reproduce

```sh
pnpm install
pnpm build
pnpm size:docs
pnpm size:compare
```

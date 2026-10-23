---
title: "Bundle size"
description: "Gzipped bundle sizes of Formhaus and other form libraries for React and Vue, with versions, the measurement method and the command to reproduce."
---

# Bundle size

Gzipped size of the code an app pays for each Formhaus entry and for other form libraries.

## Size at 1.0

CI fails a pull request that goes over these limits in `scripts/size/measure.mjs`.

<!-- size:limits:start -->

| App imports | Limit | Measured |
|---|---|---|
| Every export of `@formhaus/core` | 27.75 KB | 27.6 KB |
| Every export of `@formhaus/core` and `@formhaus/react` | 33 KB | 32.5 KB |
| Every export of `@formhaus/core` and `@formhaus/vue` | 36.5 KB | 36.4 KB |
| `FormEngine` from `@formhaus/core` | 19 KB | 18.7 KB |
| `useFormEngine` from `@formhaus/react`, with core | 20 KB | 19.5 KB |
| `useFormEngine` from `@formhaus/vue`, with core | 20 KB | 19.3 KB |
| `FormRenderer` from `@formhaus/react`, with core | 32.5 KB | 32.3 KB |
| `FormRenderer` from `@formhaus/vue`, with core | 36 KB | 35.8 KB |

<!-- size:limits:end -->

## Rendering paths

The entry you import sets the size. React and Vue are not counted.

<!-- size:paths:start -->

| Entry | You write | React | Vue |
|---|---|---|---|
| `FormEngine` | All markup, in any framework. The engine does state, conditions, validation, steps and a basic structure check | 18.7 KB | 18.7 KB |
| `useFormEngine` | All markup. The hook gives the visible fields of the step, values, errors, the current step, `setValue`, `next`, `back` and `submit` | 19.5 KB | 19.3 KB |
| `HeadlessFormRenderer` | A component for each field type, actions and progress. The renderer does steps, field order, conditions, focus and the error summary | 28.8 KB | 30.8 KB |
| `FormRenderer` | Nothing. Built-in fields, actions and progress; replace some types through `components` | 32.3 KB | 35.8 KB |

<!-- size:paths:end -->

These cost the same on any path, and only when imported:

<!-- size:addons:start -->

| Import | Adds |
|---|---|
| `checkDefinition()` with warnings and hints, for an editor, CI or AI generation | 6.2 KB |
| `@formhaus/core/cloud` | 3.3 KB |
| `@formhaus/core/i18n` | 4.4 KB |
| `@formhaus/core/fix` | 9.7 KB |
| `@formhaus/core/research` | 0.3 KB |
| `@formhaus/core/schema` | 0.2 KB |
| Engine warnings in development | 0 KB in production |

<!-- size:addons:end -->

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

## Other libraries

The same entries next to other form libraries. The second table changes only when `pnpm size:compare` runs.

<!-- size:formhaus:start -->

| Formhaus | gzip | State and validation | Rendering | Multi-step | Same validation on the server | JSON definitions |
|---|---|---|---|---|---|---|
| `@formhaus/core` `FormEngine` only | 18.7 KB | Yes | No | Yes | `validateSubmission()` | Yes |
| `@formhaus/core` + `@formhaus/react` | 32.5 KB | Yes | Yes | Yes | `validateSubmission()` | Yes |
| `@formhaus/core` + `@formhaus/vue` | 36.4 KB | Yes | Yes | Yes | `validateSubmission()` | Yes |

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
- `process.env.NODE_ENV` set to `"production"`
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

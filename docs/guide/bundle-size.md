---
title: "Bundle size"
description: "Gzipped bundle sizes of Formhaus and other form libraries for React and Vue, with versions, the measurement method and the command to reproduce."
---

# Bundle size

Gzipped size of the code an app pays for each Formhaus entry and for other form libraries.

## Size at 1.0

CI fails a pull request that goes over these limits in `scripts/check-bundle-size.mjs`.

| App imports | Limit | Measured |
|---|---|---|
| Every export of `@formhaus/core` | 27 KB | 24.3 KB |
| Every export of `@formhaus/core` and `@formhaus/react` | 33 KB | 29.5 KB |
| Every export of `@formhaus/core` and `@formhaus/vue` | 36 KB | 32.9 KB |
| `FormEngine` from `@formhaus/core` | 19 KB | 17.1 KB |
| `useFormEngine` from `@formhaus/react` or `@formhaus/vue`, with `FormEngine` | 20 KB | 17.7 KB |

`FormEngine` and each `useFormEngine` have their own budgets in `scripts/bundle-budgets.json`, which the same script checks.

## Rendering paths

The entry you import sets the size. React and Vue are not counted.

| Entry | You write | React | Vue |
|---|---|---|---|
| `FormEngine` | All markup, in any framework. The engine does state, conditions, validation, steps and a basic structure check | 17.1 KB | 17.1 KB |
| `useFormEngine` | All markup. The hook gives the visible fields of the step, values, errors, the current step, `setValue`, `next`, `back` and `submit` | 17.7 KB | 17.7 KB |
| `HeadlessFormRenderer` | A component for each field type, actions and progress. The renderer does steps, field order, conditions, focus and the error summary | 25.9 KB | 27.7 KB |
| `FormRenderer` | Nothing. Built-in fields, actions and progress; replace some types through `components` | 29.3 KB | 32.6 KB |

These cost the same on any path, and only when imported:

| Import | Adds |
|---|---|
| `checkDefinition()` with warnings and hints, for an editor, CI or AI generation | 5.8 KB |
| `@formhaus/core/cloud` | 3.1 KB |
| `@formhaus/core/i18n` | 3.8 KB |
| `@formhaus/core/fix` | 9.2 KB |
| Engine warnings in development | 0 KB in production |

Measured on main on 2026-10-20 with `node scripts/compare-bundle-size.mjs`. 1 KB is 1024 bytes.

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
  actionsComponent={MyFormActions}
  progressComponent={MyStepProgress}
  onSubmit={handleSubmit}
/>
```

`FormRenderer`: the built-in fields, with some types replaced.

```tsx
<FormRenderer definition={definition} components={{ phone: MyPhoneInput }} onSubmit={handleSubmit} />
```

Vue examples and the full props are in [Choose a renderer](/guide/#choose-a-renderer).

## Other libraries

| Library | gzip | State and validation | Rendering | Multi-step | Same validation on the server | JSON definitions |
|---|---|---|---|---|---|---|
| react-hook-form 7.90.0 | 11.5 KB | Yes | No | No | With a schema resolver shared with the server | No |
| `@formhaus/core` `FormEngine` only | 17.1 KB | Yes | No | Yes | `validateSubmission()` | Yes |
| formik 2.4.9 + yup 1.7.1 | 25.7 KB | Yes | No | No | The Yup schema runs on the server | No |
| `@formhaus/core` + `@formhaus/react` | 29.5 KB | Yes | Yes | Yes | `validateSubmission()` | Yes |
| @formkit/vue 2.1.2 | 30.1 KB | Yes | Yes | Plugin in `@formkit/addons`, not counted | No | FormKit schema |
| `@formhaus/core` + `@formhaus/vue` | 32.9 KB | Yes | Yes | Yes | `validateSubmission()` | Yes |
| react-jsonschema-form 6.11.0 (`@rjsf/core` + `@rjsf/validator-ajv8`) | 125.3 KB | Yes | Yes | No | AJV runs the JSON Schema on the server | JSON Schema and UI schema |
| SurveyJS 3.2.1 (`survey-core` + `survey-react-ui`) | 409.3 KB | Yes | Yes | Yes | `onServerValidateQuestions` calls your server check | Yes |

Formhaus built from main, the other libraries installed from npm at the versions above, all measured on 2026-10-20 and bundled with esbuild 0.28.2 as in [Method](#method).

## Imports

| Library | Entry |
|---|---|
| react-hook-form | `useForm` |
| formik + yup | `useFormik` from `formik`, `object` and `string` from `yup` |
| @formkit/vue | `plugin`, `defaultConfig`, `FormKit` |
| react-jsonschema-form | `Form` from `@rjsf/core`, `validator` from `@rjsf/validator-ajv8` |
| SurveyJS | `Model` from `survey-core`, `Survey` from `survey-react-ui` |
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

Dependencies and peer dependencies such as `@rjsf/utils` are in the bundle. Other libraries are installed from npm at the versions above into a temporary directory. Formhaus is built from the repository.

The same method runs in CI in `scripts/check-bundle-size.mjs`.

## Reproduce

```sh
pnpm install
pnpm build
node scripts/compare-bundle-size.mjs
```

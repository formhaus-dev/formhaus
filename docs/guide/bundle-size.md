---
title: "Bundle size"
description: "Gzipped bundle sizes of Formhaus and other form libraries for React and Vue, with versions, the measurement method and the command to reproduce."
---

# Bundle size

Gzipped size of the code a minimal app imports from each library.

| Library | gzip | What's inside |
|---|---|---|
| react-hook-form 7.90.0 | 11.5 KB | Form state and validation, no UI |
| `@formhaus/core` 0.19, `FormEngine` only | 15.9 KB | Logic, steps, branches, conditions, groups, validation, no UI |
| `@formhaus/core` + `@formhaus/react` 0.19 | 25.7 KB | Engine, ready fields, steps, error summary, a11y |
| `@formhaus/core` + `@formhaus/vue` 0.19 | 29.2 KB | Engine, ready fields, steps, error summary, a11y |
| @formkit/vue 2.1.2 | 30.1 KB | Ready inputs, validation rules, English messages |
| react-jsonschema-form 6.11.0 (`@rjsf/core` + `@rjsf/validator-ajv8`) | 124.7 KB | JSON Schema to UI, AJV validation |
| SurveyJS 3.2.1 (`survey-core` + `survey-react-ui`) | 409.3 KB | JSON to survey UI, pages, conditions, validation |

Formhaus measured on 2026-10-19, the other libraries on 2026-10-16. 1 KB is 1024 bytes.

## Imports

| Library | Entry |
|---|---|
| react-hook-form | `useForm` |
| @formkit/vue | `plugin`, `defaultConfig`, `FormKit` |
| react-jsonschema-form | `Form` from `@rjsf/core`, `validator` from `@rjsf/validator-ajv8` |
| SurveyJS | `Model` from `survey-core`, `Survey` from `survey-react-ui` |
| Formhaus engine | `FormEngine` from `@formhaus/core` |
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

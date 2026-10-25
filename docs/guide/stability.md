---
title: "Stable API"
description: "What semantic versioning covers in Formhaus from 1.0: definition schema, submitted values, FormEngine, React and Vue props, and checkDefinition codes."
---

# Stable API

From 1.0, a breaking change to these parts needs a major version:

- The form definition schema and its JSON Schemas (`schema.json`, `translation.schema.json`), including the meaning of built-in field types.
- The submit payload: values, keys and skipped steps.
- The `@formhaus/core` entries `.`, `/server`, `/i18n`, `/fix`, `/cloud` and `/research`: exported functions, classes and types.
- `FormEngine` public methods and properties.
- React and Vue components, including `/cloud`: props, events and slots.
- The React `useFormEngine` hook and the Vue `useFormEngine` composable.
- The props a custom field component receives.
- `checkDefinition()` issue codes and severities.
- The `--fh-*` variables listed in [Optional baseline styles](/guide/#optional-baseline-styles) and the class names in [Stable names](/guide/#stable-names). Custom properties that start with `--fhi-` are private. `api/style.api.md` in the repository lists them, and CI fails on a rename.
- `onFormEvent` event types and fields. A minor version can add event types and fields.

Not covered:

- `@formhaus/core/internal`. It is the shared code of `@formhaus/react` and `@formhaus/vue`, not a public API: any release can change or remove its exports. The adapters pin `@formhaus/core` to the same minor version, such as `~1.0.0`, so they always load the internal code they were built with. Public types never reference it.
- The editor, builder and Figma plugin.
- Warning and error message texts, fix titles and patches.
- DOM structure and class names other than the stable names.
- CSS values and the look of `style.css` and `tokens/*`. A minor version can change them and lists each change in the [changelog](/changelog).
- `@formhaus/mcp` and the `formhaus` CLI, which have their own versions.

Before 1.0, a minor version can break these parts and lists each break in the [changelog](/changelog).

0.22 removed the APIs deprecated in 0.x. See [Migrate to 0.22](/migrate/0.22), or [Migrate from 0.11 to 1.x](/migrate/1.x) for every break since 0.11.

Three rules keep forms stable across minor versions:

- Custom field types named with `-` or `:`, such as `x-rating`, never become built-in types. See [Custom field types](/guide/fields#custom-field-types).
- `initialValues` is read when the form is created, and a new `definition` object creates a new form. See [Definition and initial values](/guide/#definition-and-initial-values).
- `keepValues` and `engine.replaceDefinition()` are the opt-in way to change the definition and keep the answers. See [Keep answers when the definition changes](/guide/#keep-answers-when-the-definition-changes).

## Minimum versions

- Node 22.12 or later. The packages are ESM-only. `require()` loads them on Node 22.12 and later.
- The published JavaScript is ES2020.
- TypeScript 5.4 or later. The `.d.ts` files use `NoInfer`.
- `@formhaus/react` needs React `^18.0.0 || ^19.0.0`.
- `@formhaus/vue` needs Vue `^3.3.3`.

## Native ports

`formhaus-swift` and `formhaus-kotlin` are 0.x previews. Their APIs can change in any release. Each release passes the conformance fixtures of one `@formhaus/core` version, and a daily check in both repositories opens an issue when a newer core release is out.

| @formhaus/core | formatVersion | formhaus-swift | formhaus-kotlin |
|---|---|---|---|
| 1.6.1 | 1.6 | none | 0.7.0 |
| 1.6.0 | 1.6 | 0.4.0 | 0.6.0 |
| 1.4.2 | 1.6 | 0.3.0 | 0.5.0 |
| 1.3.0 | 1.6 | 0.1.7 to 0.2.0 | 0.3.0 to 0.4.0 |
| 1.2.2 | 1.6 | 0.1.6 | 0.1.0 to 0.2.1 |
| 1.2.0 | 1.6 | 0.1.5 | none |
| 1.1.1 | 1.6 | 0.1.4 | none |
| 1.0.0 | 1.5 | 0.1.3 | none |
| 0.22.0 | 1.5 | 0.1.0 to 0.1.2 | none |

A core release newer than the first row has no port release yet. See [iOS and macOS](/guide/ios) and [Android and JVM](/guide/android).

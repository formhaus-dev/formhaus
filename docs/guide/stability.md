---
title: "Stable API"
description: "What semantic versioning covers in Formhaus from 1.0: definition schema, submitted values, FormEngine, React and Vue props, and checkDefinition codes."
---

# Stable API

From 1.0, a breaking change to these parts needs a major version:

- The form definition schema and its JSON Schemas (`schema.json`, `translation.schema.json`), including the meaning of built-in field types.
- The submit payload: values, keys and skipped steps.
- The `@formhaus/core` entries `.`, `/server`, `/i18n`, `/fix` and `/cloud`: exported functions, classes and types.
- `FormEngine` public methods and properties.
- React and Vue components, including `/cloud`: props, events and slots.
- The React `useFormEngine` hook and the Vue `useFormEngine` composable.
- The props a custom field component receives.
- `checkDefinition()` issue codes and severities.

Not covered:

- `@formhaus/core/internal`.
- The editor, builder and Figma plugin.
- Warning and error message texts, fix titles and patches.
- DOM structure and CSS class names.
- CSS custom properties (`--fh-*`). A minor version can change them and lists each change in the [changelog](/changelog).
- `@formhaus/mcp` and the `formhaus` CLI, which have their own versions.

Before 1.0, a minor version can break these parts and lists each break in the [changelog](/changelog).

1.0 removes the APIs deprecated in 0.x, as announced in the changelog:

- `validateDefinition` from `@formhaus/core`. Use `checkDefinition()`.
- The Vue `submitHandler` prop. Use the `@submit` event.

Two rules keep forms stable across minor versions:

- Custom field types named with `-` or `:`, such as `x-rating`, never become built-in types. See [Custom field types](/guide/fields#custom-field-types).
- `initialValues` is read when the form is created, and a new `definition` object creates a new form. See [Definition and initial values](/guide/#definition-and-initial-values).
- `keepValues` and `engine.replaceDefinition()` are the opt-in way to change the definition and keep the answers. See [Keep answers when the definition changes](/guide/#keep-answers-when-the-definition-changes).

## Minimum versions

- Node 22.12 or later. The packages are ESM-only. `require()` loads them on Node 22.12 and later.
- The published JavaScript is ES2020.
- TypeScript 5.4 or later. The `.d.ts` files use `NoInfer`.
- `@formhaus/react` needs React `^18.0.0 || ^19.0.0`.
- `@formhaus/vue` needs Vue `^3.3.3`.

---
title: "Stable API"
description: "What semantic versioning covers in Formhaus from 1.0: definition schema, submitted values, FormEngine, React and Vue props, and checkDefinition codes."
---

# Stable API

From 1.0, a breaking change to these parts needs a major version:

- The form definition schema and its JSON Schema, including the meaning of built-in field types.
- The submit payload: values, keys and skipped steps.
- `FormEngine` public methods and properties.
- React and Vue component props, events and slots.
- `checkDefinition()` issue codes and severities.

Not covered:

- `@formhaus/core/internal`.
- The editor and builder packages.
- Warning and error message texts.

Before 1.0, a minor version can break these parts and lists each break in the [changelog](/changelog).

Two rules keep forms stable across minor versions:

- Custom field types named with `-` or `:`, such as `x-rating`, never become built-in types. See [Custom field types](/guide/fields#custom-field-types).
- `initialValues` is read when the form is created, and a new `definition` object creates a new form. See [Definition and initial values](/guide/#definition-and-initial-values).

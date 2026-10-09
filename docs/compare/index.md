---
title: "Compare Formhaus with other form libraries"
description: "How Formhaus compares with react-hook-form, TanStack Form, react-jsonschema-form and SurveyJS, with sources, bundle sizes and migration examples."
---

# Compare Formhaus

Formhaus fits forms that are data: one JSON definition with steps, branching routes and conditional fields, rendered in React, Vue and Figma. Code-first libraries fit forms written once by hand in one framework.

| Library | Definition | Pick it when | Comparison |
|---|---|---|---|
| react-hook-form | React code | A React form written and maintained by developers | [Formhaus vs react-hook-form](/compare/react-hook-form) |
| TanStack Form | TypeScript code | Typed form state in React, Vue, Angular, Solid, Svelte or Lit | [Formhaus vs TanStack Form](/compare/tanstack-form) |
| react-jsonschema-form | JSON Schema + uiSchema | The data model is already a JSON Schema | [Formhaus vs react-jsonschema-form](/compare/react-jsonschema-form) |
| SurveyJS | SurveyJS JSON | Surveys with scoring, matrices and a drag-and-drop builder for non-developers | [Formhaus vs SurveyJS](/compare/surveyjs) |

## Formhaus at a glance

| | Formhaus |
|---|---|
| Definition format | JSON (`FormDefinition`), checked by a published [JSON Schema](/api/definition#json-schema) |
| Multi-step | `steps` with per-step validation, skip and progress ([guide](/guide/steps)) |
| Branching routes | `routes` on a step pick the next step from answers ([guide](/guide/steps#route-between-branches)) |
| Conditional fields | `show` and `showAny`; hidden values are cleared and not submitted ([guide](/guide/conditions)) |
| Validation | Declarative rules, named custom validators, async step validation ([guide](/guide/validation)) |
| Custom components | `components` map per field type, headless renderer ([guide](/guide/custom-components)) |
| Figma | Plugin draws the same definition with your design system ([guide](/guide/figma)) |
| AI tooling | JSON Schema, `@formhaus/mcp` server, Claude Code plugin ([guide](/guide/mcp)) |
| Frameworks | React 18+, Vue 3.3+, framework-agnostic engine |
| Bundle size | `@formhaus/core` 6.2 KB, `@formhaus/react` 4.8 KB, `@formhaus/vue` 6.4 KB gzipped |
| License | MIT |

Formhaus sizes are minified ESM bundles gzipped at level 9 (1 KB = 1024 bytes) with `scripts/check-bundle-size.mjs` from the repository, measured on 2026-10-09 for version 0.8.0. The React and Vue numbers exclude `@formhaus/core`. Competitor sizes on each page come from [bundlephobia](https://bundlephobia.com), measured on the same date.

## Sources

Every statement about another library links to its documentation, npm metadata or issue tracker. Facts were checked on 2026-10-09. If something has changed, open an issue on [GitHub](https://github.com/ignsm/formhaus/issues).

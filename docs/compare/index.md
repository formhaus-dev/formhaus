---
title: "Compare form libraries"
description: "How Formhaus compares with react-hook-form, react-jsonschema-form, JSON Forms and SurveyJS, with sources, bundle sizes and migration examples."
---

# Compare Formhaus

Formhaus fits forms that are data: one JSON definition with steps, branching routes and conditional fields, rendered in React, Vue and Figma. Code-first libraries fit forms written once by hand in one framework.

| Library | Definition | Pick it when | Comparison |
|---|---|---|---|
| react-hook-form | React code | A React form written and maintained by developers | [Formhaus vs react-hook-form](/compare/react-hook-form) |
| react-jsonschema-form | JSON Schema + uiSchema | The data model is already a JSON Schema | [Formhaus vs react-jsonschema-form](/compare/react-jsonschema-form) |
| JSON Forms | JSON Schema + UI schema | The data model is a JSON Schema and the app is in Angular, React or Vue | [Formhaus vs JSON Forms](/compare/json-forms) |
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
| Frameworks | React 18 and 19, Vue 3.3.3+, framework-agnostic engine |
| Bundle size | <!-- size:react:start -->30.9 KB<!-- size:react:end --> `@formhaus/core` + `@formhaus/react`, <!-- size:vue:start -->34.3 KB<!-- size:vue:end --> `@formhaus/core` + `@formhaus/vue`, gzipped ([how it's measured](/guide/bundle-size)) |
| License | MIT |

All sizes on these pages come from [Bundle size](/guide/bundle-size), with one method for every library.

## Sources

Every statement about another library links to its documentation, npm metadata or issue tracker. Facts were checked on 2026-10-09. If something has changed, open an issue on [GitHub](https://github.com/formhaus-dev/formhaus/issues).

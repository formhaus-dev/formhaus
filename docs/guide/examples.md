---
title: "Form definition examples"
description: "Example Formhaus JSON definitions: basic form, conditional fields, multi-step, validation and a branching form with radio auto-advance."
---

# Examples

The JSON files in [`examples/definitions`](https://github.com/ignsm/formhaus/tree/main/examples/definitions) are returned by the MCP server's `example_definitions` tool. All of them except `branching-form.json` and `event-registration.json` are also playground presets. Copy any of them into a project and pass it to `FormRenderer`.

## Basic form

A single-step contact form with text, email, autocomplete and datetime fields and required rules.

<<< @/../examples/definitions/basic-form.json

## Conditional fields

A payment form where `show` conditions on `paymentMethod` reveal card or crypto wallet fields.

<<< @/../examples/definitions/conditional-fields.json

## Multi-step form

A three-step account setup with progress, defaults, a select, a checkbox, a radio and a switch.

<<< @/../examples/definitions/multi-step.json

## Validation

A registration form with length, pattern, range and `matchField` rules and custom messages.

<<< @/../examples/definitions/validation.json

## Branching form

A radio answer with `autoAdvance` picks a business or personal step, and both branches converge at review through `routes`. See the [routing guide](/guide/steps#route-between-branches).

<<< @/../examples/definitions/branching-form.json

## Event registration

A [section](/guide/sections) for the billing address shows when an invoice is requested, and a [repeatable group](/guide/groups) collects up to five participants. Requires `@formhaus/core` 0.15.

<<< @/../examples/definitions/event-registration.json

## Next steps

- [Recipes](/recipes/): complete forms for common jobs with React and Vue code
- [Figma Plugin](/guide/figma): render these definitions as Figma mockups
- [/formhaus:formhaus-create-form](/guide/formhaus-create-form): generate new definitions with Claude
- [Definition Reference](/api/definition): full TypeScript types

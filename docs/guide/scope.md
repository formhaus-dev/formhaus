---
title: "What Formhaus covers"
description: "What Formhaus does, what it does not do with the workaround for each gap, and when another form library such as React Hook Form fits better."
---

# What Formhaus covers

What the definition format, the engine and the renderers do, what they leave to your app, and where another library fits better.

## Covered

| Area | What you get | Guide |
|---|---|---|
| Definitions | Plain JSON with a [JSON Schema](https://formhaus.dev/schema/form-definition.json). Agents generate and check it, apps store it in a database, and native renderers read the same file under the [specification](/spec). | [Specification](/spec), [MCP server](/guide/mcp) |
| React and Vue | `FormRenderer` with built-in fields, `HeadlessFormRenderer` and `useFormEngine` | [Choose a renderer](/guide/#choose-a-renderer) |
| Multi-step | Steps, Back and Next, skip, welcome screen, lifecycle hooks | [Multi-Step Forms](/guide/steps) |
| Conditions and routes | `show` and `showAny` on fields, sections and steps, routes between branches | [Conditional Fields](/guide/conditions), [Route between branches](/guide/steps#route-between-branches) |
| Groups | Repeatable items with item count rules and per-item conditions | [Repeatable Groups](/guide/groups) |
| Matrix | A section drawn as a grid of `radio` or `multiselect` rows | [Matrix](/guide/sections#matrix) |
| Scales | `scale`, NPS and `rating` | [Scale](/guide/fields#scale), [Rating](/guide/fields#rating) |
| Answer recall | `{{key}}` tokens that show an earlier answer in later texts | [Answer recall](/guide/fields#answer-recall) |
| i18n | Message and label catalogs, translation keys, overlays | [Translations](/guide/translations) |
| Accessibility | Native inputs, labels and hints tied by `aria-describedby`, `aria-invalid`, `autocomplete` tokens, error summary with focus | [Autofill](/guide/fields#autofill-and-line-breaks), [Error summary](/guide/errors#error-summary-and-step-marks) |
| Server validation | `validateSubmission()` runs the same rules and type checks on the server as the browser | [Server-side Validation](/guide/server-validation) |
| Events | `form_viewed`, `step_completed`, `field_error`, `form_submitted` and other lifecycle events | [Form events](/guide/custom-components#form-events) |
| Hidden fields | Values from the URL, referrer, page, page title, language, time zone, device or country | [Value sources](/guide/fields#value-sources) |
| Files | A `File` in the browser, a reference such as an upload id on the server | [File](/guide/fields#file), [Cloud files](/guide/endpoint#files) |
| Cloud | Optional hosted endpoint, hosted form page and file uploads | [Get an Endpoint](/guide/endpoint) |

## Not covered

| Gap | Workaround |
|---|---|
| Calculated values or scoring inside the definition | Add a `hidden` field and set it from app code with `setValue`. Compute it again on the server: `validateSubmission()` checks only its type and rules. See [Derived values](/recipes/derived-values). |
| Nested groups | A group cannot contain a group or a section (`invalid-nesting`). Use two top-level groups, or a [custom field type](/guide/fields#custom-field-types) inside the item that holds the inner list. |
| Files inside groups | A group cannot contain a `file` or `hidden` field (`invalid-nesting`). Put the `file` field outside the group, or use a custom field type in the item that uploads the file and stores its reference as text. |
| Payment card fields | There is no card field type. Use the payment provider's own elements next to the form. Formhaus Cloud refuses hosted forms with `cc-*` autocomplete tokens. |
| Signatures, rich text, address autocomplete with maps | Write a [custom field type](/guide/fields#custom-field-types) and pass its component through `components`. See also [custom components](/guide/custom-components). |
| Offline drafts with sync | Save `onValuesChange` values in your own storage, pass them back as `initialValues`, and queue the submit in app code. `FormhausForm` keeps a draft in `sessionStorage` of the tab by default, with no sync. See [Drafts](/guide/endpoint#drafts). |
| Pixel-unique design | Replace field components through `components`, or use [`HeadlessFormRenderer`](/guide/custom-components#headless-renderer) or [`FormEngine`](/recipes/headless-engine) with your own markup. |

## When another library fits better

- One hand-written form with custom UI and no JSON definition: a form-state library such as React Hook Form is smaller. See [vs react-hook-form](/compare/react-hook-form).
- Large survey programs that need expressions, calculated values, result dashboards or a drag-and-drop editor for non-developers: a survey platform covers them. See [vs SurveyJS](/compare/surveyjs).

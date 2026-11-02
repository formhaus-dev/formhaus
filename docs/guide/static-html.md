---
title: "Static HTML"
description: "Render a single-page Formhaus definition to an HTML string with @formhaus/core/html, and read the post back into typed values. No React, Vue or DOM."
---

# Static HTML

`@formhaus/core/html` renders a definition to a `<form>` string and reads the posted fields back into values. It needs no React, Vue, DOM or Node API. The markup and class names match the React and Vue renderers, so `style.css` styles it.

```ts
import { parseFormData, renderToStaticMarkup } from '@formhaus/core/html';

const html = renderToStaticMarkup(definition, {
  values: { email: 'ada@example.com' },
  errors: { email: 'Already registered' },
  action: '/signup',
  hiddenInputs: { csrf: token },
});

const values = parseFormData(definition, formData);
```

For an engine without ES modules, load `@formhaus/core/html.iife.js`. It sets the global `FormhausHtml` with the same two functions and needs ES2020 syntax.

## What it supports

One page of fields: every field type except `file`, sections, conditions at the initial values, `recall` tokens, read-only fields and the error summary. It throws for a definition with `steps`, a `group` or a `file` field, and for an invalid definition.

The form posts without JavaScript. The primary button submits, and there are no back, skip or cancel buttons. To post a named choice such as Cancel, use `secondaryActions` and read `name` from the post.

## Options

| Option | Effect |
|---|---|
| `values` | Prefilled values |
| `errors` | Field errors by key, shown under the field and in the error summary |
| `formErrors` | Form-level errors, shown above the button |
| `action`, `method` | Where the form posts. `method` is `post` by default. Only relative, `http` and `https` actions are written |
| `id`, `className` | Form id, which also prefixes field ids, and an extra class |
| `hiddenInputs` | Hidden inputs, for example a CSRF token. A field key cannot have the same name |
| `errorSummary` | `'bottom'` (default), `'top'` or `false` |
| `readOnly`, `novalidate` | Lock every field, or turn off native validation |
| `autofocus` | Field key to focus on load. Writes the native `autofocus` attribute on its control, or on the first control of a choice field. Ignored for a field that is not visible, hidden or read-only |
| `secondaryActions` | Extra submit buttons as `{ label, name, value, novalidate? }`. They follow the primary button in the markup so Enter submits the primary action, and show before it. `novalidate` skips native validation for that button. A name cannot match a field key |
| `options` | Options for fields with `optionsFrom`, by field key |
| `labels`, `locale`, `messages`, `lang`, `seed`, `research`, `hiddenValues` | As on `FormEngine` |

Conditions are computed once from `values`. Render again with the posted values to update them.

## Native attributes

`required`, `type`, `minlength`, `maxlength`, number `min`, `max` and `step="any"`, and `pattern` for text types. A `pattern` is written as a search pattern, because the format matches anywhere in the value. A checked checkbox posts `on`. A password field never gets a `value`. Autocomplete fields post the option label.

## Reading the post

`parseFormData(definition, fields)` takes `FormData`, `URLSearchParams` or an object of strings and string lists, and throws on anything else. It returns typed values by field key: booleans for checkboxes and switches (an unchecked box is `false`), lists for multiselects, numbers for number, scale and rating fields, and option values for autocomplete labels. Pass `options` for fields with `optionsFrom`. Repeated names are capped at 1000 values, and a multiselect keeps at most as many values as it has options.

## The server must validate

The posted values come from the browser. Run `validateSubmission` from `@formhaus/core/server` on every submit, and do not trust `readOnly`, hidden inputs or conditions as limits. Read-only is a rendering state.

## Performance and limits

Values and errors are checked before use: only strings, numbers, booleans and lists of them are rendered, and unknown keys are dropped.

A definition object is validated once. Keep the parsed object for each form version, and pass a new object after you change it. Rendering takes microseconds in Node with a kept definition. An embedded interpreter such as goja is much slower, so keep the parsed definition there too.

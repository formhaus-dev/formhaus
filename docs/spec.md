---
description: "Specification of the Formhaus form definition format 1.0: structure, fields, conditions, validation, steps, routes, skip and the submit payload."
---

# Formhaus form definition 1.0

This page specifies the JSON format that `@formhaus/core` reads, and how `FormEngine` interprets it. The [JSON Schema](https://formhaus.dev/schema/form-definition.json) describes the shape; this page describes the behaviour. For the TypeScript types, see the [Definition Reference](/api/definition).

## Conventions

The key words MUST, MUST NOT, SHOULD and MAY are used as described in [RFC 2119](https://www.rfc-editor.org/rfc/rfc2119). They appear only where `FormEngine` enforces the rule by throwing an error or by its runtime behaviour.

- **Core** means `FormEngine` from `@formhaus/core`.
- **Renderer** means a UI layer that draws a definition: `@formhaus/react`, `@formhaus/vue`, the Figma plugin, or a custom renderer built on core.
- **Value** means an entry in `engine.values`, keyed by field `key`.
- **Empty** means `undefined`, `null`, `''` or `[]` unless a section says otherwise.

## Versioning

This document describes **Formhaus form definition 1.0**. `@formhaus/core` 0.9.x implements it. A definition carries no version marker.

- Additive changes, such as a new optional property or a new built-in field type, are minor versions.
- Removing or renaming a property, or changing the meaning of an existing one, is a major version.
- The JSON Schema `$id`, `https://formhaus.dev/schema/form-definition.json`, is the canonical identifier of the format. It is unversioned and always describes the latest version. A major version publishes the previous schema under a versioned URL and states it in this section.

## Document structure

A definition is a JSON object. The [JSON Schema](https://formhaus.dev/schema/form-definition.json) rejects unknown properties at every level. Core ignores them.

| Property | Type | Required | Meaning |
|---|---|---|---|
| `$schema` | string | no | Editor hint. Core ignores it. |
| `id` | string | yes | Form identifier. Renderers use it to detect a new form. |
| `title` | string | yes | Form title for host UI and Figma output. Renderers do not display it. |
| `description` | string | no | Plain text shown under the title by host UI and Figma output, up to 1000 characters. Renderers do not display it. |
| `submit` | [action](#actions) | yes | The submit action on the last step. |
| `cancel` | [action](#actions) | no | A cancel action. Renderers show it on every step. |
| `fields` | [field](#fields)[] | no | Fields of a single-step form. |
| `steps` | [step](#steps)[] | no | Steps of a multi-step form. |

A form is **multi-step** when `steps` is a non-empty array. Otherwise it is single-step and uses `fields`. A definition with neither is a valid empty form.

A definition MUST NOT have both a non-empty `fields` and a non-empty `steps`. The `FormEngine` constructor throws on it.

## Fields

| Property | Type | Meaning |
|---|---|---|
| `key` | string, required | Key of the value. Keys are flat: `"address.city"` stays one key. |
| `type` | string, required | [Field type](#field-types). |
| `label` | string, required | Label text. |
| `placeholder` | string | Placeholder text. |
| `helperText` | string | Hint text between the label and the control. |
| `defaultValue` | any | Initial value. See [Defaults](#defaults-and-initial-values). |
| `show` | [condition](#conditions)[] | Visible when all conditions match. |
| `showAny` | [condition](#conditions)[] | Visible when at least one condition matches. |
| `validation` | [validation](#validation) | Validation rules. |
| `options` | `{ value: string, label: string }[]` | Choices for `select`, `radio`, `multiselect` and `autocomplete`. |
| `layout` | `"stack"` or `"inline"` | Option layout for `radio` and `multiselect`. `stack` (default) lists options vertically. `inline` places short options side by side. |
| `optionsFrom` | string | Name of a renderer options provider. |
| `optionsDependsOn` | string[] | Field keys whose changes reload `optionsFrom`. |
| `autoAdvance` | boolean | See [Auto-advance](#auto-advance). |
| `accept` | string | Accepted file types for `file`. |
| `rows` | number | Row count for `textarea`. |
| `mask` | string | Input mask. Built-in renderers use it as the placeholder when `placeholder` is absent. |
| `inputMode` | `text`, `numeric`, `decimal`, `tel`, `email`, `url`, `search` | Virtual keyboard hint. |

Field keys MUST be unique on every possible path. Two fields MAY share a key only when they are on route branches that never meet on one path; then the field on the active path owns the value. The constructor throws on any other duplicate.

### Field types

`type` is any string. The built-in renderers provide these types:

| Type | Value written by built-in renderers |
|---|---|
| `text`, `email`, `phone`, `password`, `textarea`, `autocomplete` | string |
| `number` | number, or `''` when the input is cleared |
| `select`, `radio` | string, the selected option `value` |
| `multiselect` | string[] of selected option values |
| `checkbox`, `switch` | boolean |
| `file` | a `File`, or `null` |
| `date` | string `YYYY-MM-DD` |
| `datetime` | string `YYYY-MM-DDTHH:mm`, without a timezone |

Any other string is a **custom type**. A renderer provides its component through its `components` option. The built-in React and Vue renderers show an "Unsupported field type" placeholder for a type without a component. Core does not interpret `type`, except that an unchecked `checkbox` or `switch` (`false`) counts as empty for `required`.

### Options

`options` is a static list. `optionsFrom` names an options provider passed to the renderer. Built-in renderers call the provider with all current values, and again each time a field in `optionsDependsOn` changes. The returned options replace `options`. Core does not read `options`, `optionsFrom` or `optionsDependsOn`, and does not check that a value is one of the options.

## Conditions

A condition tests the value of one field:

| Property | Type | Matches when |
|---|---|---|
| `field` | string, required | Key of the field to test. |
| `eq` | string, number or boolean | value `===` `eq` |
| `neq` | string, number or boolean | value `!==` `neq` |
| `in` | (string or number)[] | the list contains the value |
| `notIn` | (string or number)[] | the list does not contain the value |
| `notEmpty` | boolean | `true`: the value is not empty |
| `gt` | number | the numeric value `>` `gt` |
| `gte` | number | the numeric value `>=` `gte` |
| `lt` | number | the numeric value `<` `lt` |
| `lte` | number | the numeric value `<=` `lte` |

A condition MUST use exactly one operator. The constructor throws on a condition with no operator, with several operators, or with a key that is not an operator. At runtime, a condition without a known operator never matches. `notEmpty: false` always matches.

Comparison is strict and without type coercion: `"1"` does not equal `1`. `in` and `notIn` test the value itself, so an array value never matches `in`. `false` and `0` count as not empty for `notEmpty`. `in: []` never matches; `notIn: []` always matches.

For `gt`, `gte`, `lt` and `lte`, the numeric value is the value itself when it is a finite number, or `Number(value)` when it is a non-empty string that converts to a finite number. Any other value, including an empty one, does not match.

### Combining conditions

An object with `show` and `showAny` is visible when:

- every condition in `show` matches, and
- `showAny` is absent or empty, or at least one of its conditions matches.

An empty `show` array always passes. An empty `showAny` array is treated as absent. The same rule applies to steps and routes.

## Visibility

Every condition sees the **active projection**: the values of visible fields on the steps of the [active path](#active-path) before the current one, plus the values of its own step. Field, step, route and action conditions use the same rule, with or without routes. In a single-step form, the projection is the values of the visible fields.

A field condition MUST reference a field of the same or an earlier step. A step condition MUST reference a field of an earlier step. The constructor throws on a condition that references a later step or a key that is not a field key. Values for keys that are not field keys, such as extra initial values, are never in the projection.

A field is visible when its own conditions pass and, in a multi-step form, its step is on the active path.

Core clears the value of a field that is hidden. The key is removed from `engine.values` and its error is removed. Clearing runs when the engine is constructed, after `reset()`, after every `setValue()` and after Skip, so a value written to a hidden field is cleared at once. It cascades: if a cleared value hides another field or step, that value is cleared too. Every field of a step hidden by its own conditions is cleared. A field that becomes visible again starts empty; its `defaultValue` is not restored.

In a form with [routes](#routes), fields on steps that are off the active path keep their values. See [Routes](#routes).

Hidden fields are not validated and not submitted.

## Defaults and initial values

When the engine is constructed or reset, values are built in this order:

1. `defaultValue` of every field that has one.
2. The initial values passed to `new FormEngine(definition, initialValues)` or `reset(values)`. They override defaults.
3. Hidden fields are cleared.

Initial values for keys that do not belong to any field stay in `engine.values` but are not submitted.

## Validation

`validation` holds these rules:

| Rule | Type | Applies to | Default message |
|---|---|---|---|
| `required` | boolean or string | any value | `This field is required` |
| `minLength` | number | string length, array length | `Must be at least N characters` (`items` for arrays) |
| `maxLength` | number | string length, array length | `Must be at most N characters` (`items` for arrays) |
| `min` | number | number values | `Must be at least N` |
| `max` | number | number values | `Must be at most N` |
| `pattern` | string | `String(value)` | `Invalid format` |
| `matchField` | string | any value | `Fields must match` |
| `validator` | string | any value | message returned by the validator |

Each rule except `required` and `validator` has a matching message property: `minLengthMessage`, `maxLengthMessage`, `minMessage`, `maxMessage`, `patternMessage`, `matchFieldMessage`. A string `required` is its own message.

Core evaluates one field as follows and returns the first error:

1. If the value is empty, return the `required` error when `required` is `true` or a non-empty string, otherwise no error. No other rule runs. For validation, empty also includes `false` for `checkbox` and `switch`.
2. For a string or array: `minLength`, then `maxLength`. For a number: `min`, then `max`. Other value types skip these rules. A numeric string is not converted.
3. `pattern`, compiled with `new RegExp(pattern)` without flags and without implicit anchors. An invalid pattern is a definition error, so the constructor throws on it.
4. `matchField`: the value is compared with `===` to the value of the named field. A field on a skipped step has no value here. In a form with routes, a field off the active path has no value either.
5. `validator`: the named function from the `validators` option is called with the value and the values that `matchField` uses. A non-empty string result is the error; `null` or `''` is no error, and `validateField()` returns `null` for both. An unregistered name is ignored at runtime, and the constructor logs a warning for it. The validator never receives an empty value, because step 1 returns first.

Validation runs on Continue for the visible fields of the current step, and on Submit for the visible fields of every non-skipped step on the active path. Renderers do not validate on blur. When Submit fails validation, the engine moves to the first step with an error. Like `setErrors()`, this move does not run the step change hooks. Built-in renderers focus the first invalid field after a failed Continue or Submit.

## Steps

| Property | Type | Meaning |
|---|---|---|
| `id` | string, required | Step identifier. |
| `title` | string, required | Step heading. |
| `description` | string | Text below the heading. |
| `fields` | [field](#fields)[], required | Fields of the step. |
| `show`, `showAny` | [condition](#conditions)[] | Step visibility. |
| `routes` | [route](#routes)[] | Ordered forward destinations. |
| `next` | [action](#actions) or `false` | Continue action. |
| `back` | [action](#actions) or `false` | Back action. |
| `skip` | [action](#actions) | Skip action. See [Skip](#skip). |

Step ids MUST be unique. The constructor throws on duplicates.

A hidden step is left out of navigation, progress, validation and submission, and its field values are cleared.

Step `show`/`showAny` MUST reference fields of earlier steps. A step condition sees only the values of earlier steps on the path.

## Actions

An action is an object:

| Property | Type | Meaning |
|---|---|---|
| `label` | string, required | Button text. |
| `variant` | `primary`, `secondary`, `text` | Button style. |
| `action` | string | Identifier for custom action components. |
| `disabled` | [condition](#conditions)[] | Disabled when all conditions match. |

The five action slots are:

- `submit` replaces Continue on the last step of the active path, and is the only primary action of a single-step form.
- `next` sets the Continue label. `next: false` hides Continue on that step. It does not block navigation, and it never hides Submit on the last step. Renderers do not show Skip on a step with `next: false`.
- `back` sets the Back label. `back: false` hides Back. Back never appears on the first step.
- `skip` shows a Skip action on that step.
- `cancel` shows a Cancel action that calls the renderer's cancel handler. Core has no cancel operation.

Built-in renderers draw Continue and Submit as primary, Back as secondary, and Skip and Cancel as text buttons. `variant` changes the style of `back`, `skip` and `cancel`. Built-in renderers evaluate `disabled` only on `submit`, against `getSubmitValues()`. Values of fields off the active path and of skipped steps do not count. An empty `disabled` array never disables. Default labels are `Continue`, `Back`, `Skip` and `Submit`. In built-in renderers, Enter in a single-line input runs the primary action.

## Routes

A route is `{ "to": string | null, "show"?: condition[], "showAny"?: condition[] }`. Routing is enabled for the whole form when at least one step has a non-empty `routes` array. Without routes, the active path is every visible step in declaration order.

Rules enforced by the constructor:

- `to` MUST be the id of a later declared step, or `null`. Unknown, self and backward targets throw. Routes cannot form cycles.
- Route conditions MUST reference fields of the same step or an earlier step.

Route selection on a step:

1. Routes are tried in order. A route matches when its conditions pass and its target step is visible. A route to a hidden step is passed over.
2. The first match wins. A route without conditions always matches, so it serves as a fallback when it is last.
3. A matching `to: null` makes this step the last step of the path. Submit appears there. It does not submit the form.
4. If no route matches, the path continues with the next declared step.

Branches converge only through routes. A branch step without an exit route falls through to the next declared step, which may be a sibling branch. `checkDefinition()` warns when a route target has no unconditional route and the next declared step is another target of the same step.

### Active path

Core computes the active path from the first declared step, with or without routes:

1. Start with an empty set of path values.
2. A step whose `show`/`showAny` fails against the path values of earlier steps is passed over and the next declared step is tried.
3. A visible step joins the path. Its visible fields with defined values are added to the path values. Field conditions in that step see the earlier path values and every value of the same step.
4. The next step comes from [route selection](#routes), evaluated against the path values. Without routes, it is the next declared step.

The path values are the **active projection**. Route conditions, step conditions, field visibility, action `disabled`, validation, lifecycle hooks and submission use the active projection, not `engine.values`. Values of fields on steps off the path stay in `engine.values`, so returning to a branch restores them, but they cannot select a route or enter the payload.

When a value change removes the current step from the path, core moves to the nearest earlier step of the old path that is still on the new path. Back moves to the previous step of the current path.

## Skip

Skip on a step with `skip`:

1. Resets the step's fields to their `defaultValue`, or removes them when there is none, and removes their errors.
2. Marks the step as skipped and moves to the next step of the path computed from the reset values. Skip does not run field validation or `onStepValidate`. `skip()` runs `onBeforeStepChange` and `onAfterStepChange` with `reason: 'skip'`; `false` from the before-hook cancels the skip and changes nothing.
3. A skipped step is excluded from submit validation. Its fields are excluded from the payload and from the values that validation and lifecycle hooks receive.

On the last step, `skip(submit)` submits the form without that step and runs the submit hooks. Built-in renderers pass their submit handler, so their Skip submits. `skip()` without a handler returns `false` there. Continue or Submit on a skipped step, or a changed value of one of its fields, includes it again. `checkDefinition()` warns about `skip` on a step with `next: false` or in a form with one step.

## Auto-advance

`autoAdvance: true` lets a renderer advance when the user commits an answer. The built-in `radio` commits on click, Space and Enter; arrow keys only select. Commit validates the whole current step and then moves forward. Initial values and `setValue()` never advance, and the last step never auto-submits. Other built-in types ignore `autoAdvance`. Custom fields commit through `onCommit` in React and the `commit` event in Vue.

## Submit payload

`getSubmitValues()` and the submit handler receive an object with:

- every visible field with a value other than `undefined`, on every step of the active path, or every visible field of a single-step form;
- `null`, `''`, `false` and `[]` values included;
- fields of skipped steps, hidden fields, fields off the active path and keys that are not field keys excluded.

Keys are field keys as written. The payload is not nested and not type-converted.

## Definition checks

`checkDefinition(definition)` never throws. It returns a list of issues. Each issue has a `code`, a `severity` (`error` or `warning`), a JSON pointer `path` to the node, a `message` of the form `<path>: <what is wrong>. <how to fix>.`, and an optional `hint` with the fix. Errors come before warnings.

The `FormEngine` constructor runs the same checks. It throws a `FormDefinitionError` with the errors in `issues`, and passes each warning to the `onWarning` option. Without `onWarning`, it logs warnings with `console.warn`, except when `process.env.NODE_ENV` is `production`. `validateSubmission()` does not log them.

| Code | Severity | Reported for |
|---|---|---|
| `invalid-type` | error | A definition that is not an object; `fields`, `steps`, `steps[].fields`, `routes`, `options`, `show`, `showAny` or `disabled` that is not an array of objects; or a property of the wrong type, such as `in` that is not an array or `max` that is not a number |
| `missing-property` | error | A missing `id`, `submit`, step `id`, field `key` or `type`, route `to` or condition `field`. A missing `title` is a warning |
| `fields-and-steps` | error | Both `fields` and `steps` non-empty |
| `duplicate-step-id` | error | Two steps with one id |
| `reserved-key` | error | A field key that is a built-in object property name, such as `constructor` |
| `route-target` | error | A route target that is not a later declared step id or `null` |
| `unknown-field` | error, warning for `optionsDependsOn` | A condition, `matchField` or `optionsDependsOn` key that is not a field key |
| `forward-reference` | error | A field or route condition on a later step, or a step condition on the same or a later step |
| `condition-operator-count` | error | A condition with no operator or with several |
| `unknown-operator` | error | A condition key that is not an operator |
| `condition-cycle` | error | Show conditions that depend on each other in a cycle |
| `invalid-pattern` | error | A `pattern` that is not a valid regular expression |
| `duplicate-key` | error | A field key that an earlier field on a possible path already uses |
| `invalid-range` | error | `minLength` greater than `maxLength`, or `min` greater than `max` |
| `condition-value-mismatch` | warning | A condition value of the wrong type for the field, a value that is not one of its static `options`, or `eq`, `neq`, `in` or `notIn` on a `multiselect` |
| `rule-not-applicable` | warning | `min`/`max` on a built-in type other than `number`, or `minLength`/`maxLength` on `number`, `checkbox` or `switch` |
| `missing-options` | warning | `select`, `radio` or `multiselect` without `options` or `optionsFrom` |
| `default-not-in-options` | warning | A `defaultValue` that is not one of the `options` |
| `unknown-field-type` | warning | A field type that looks like a typo of a built-in type, such as `txt` |
| `unknown-validator` | warning | A `validator` name missing from the `validators` option. Reported only when validators are passed |
| `skip-unreachable` | warning | `skip` on a step with `next: false`, or in a form with one step |
| `route-fallthrough` | warning | A branch that falls through into a sibling branch |

`parseDefinition(input)` returns the input typed as a definition, or throws a `FormDefinitionError` with the errors.

## JSON Schema

The JSON Schema is published at [`https://formhaus.dev/schema/form-definition.json`](https://formhaus.dev/schema/form-definition.json) and ships as `@formhaus/core/schema.json`. A definition MAY set `$schema` to that URL for editor validation and completion. The schema checks shape only. Rules that depend on other parts of the definition, such as route targets, are checked by `checkDefinition()`.

Minimal single-step definition:

```json
{
  "$schema": "https://formhaus.dev/schema/form-definition.json",
  "id": "contact",
  "title": "Contact",
  "submit": { "label": "Send" },
  "fields": [
    { "key": "name", "type": "text", "label": "Name", "validation": { "required": true } }
  ]
}
```

## Complete example

This definition is normative. It uses conditions, defaults, validation, routes with convergence, `to: null`, skip and action overrides.

```json
{
  "$schema": "https://formhaus.dev/schema/form-definition.json",
  "id": "account-application",
  "title": "Open an account",
  "submit": { "label": "Open account" },
  "cancel": { "label": "Cancel", "variant": "text" },
  "steps": [
    {
      "id": "kind",
      "title": "Account type",
      "next": false,
      "back": false,
      "fields": [
        {
          "key": "accountType",
          "type": "radio",
          "label": "Account type",
          "autoAdvance": true,
          "validation": { "required": "Choose an account type" },
          "options": [
            { "value": "business", "label": "Business" },
            { "value": "personal", "label": "Personal" },
            { "value": "waitlist", "label": "Not sure yet" }
          ]
        }
      ],
      "routes": [
        { "to": null, "show": [{ "field": "accountType", "eq": "waitlist" }] },
        { "to": "business", "show": [{ "field": "accountType", "eq": "business" }] },
        { "to": "personal" }
      ]
    },
    {
      "id": "business",
      "title": "Company",
      "fields": [
        { "key": "company", "type": "text", "label": "Company name", "validation": { "required": true, "minLength": 2 } },
        {
          "key": "employees",
          "type": "number",
          "label": "Employees",
          "validation": { "min": 1, "max": 10000, "maxMessage": "Contact sales for more than 10000 employees" }
        }
      ],
      "routes": [{ "to": "contact" }]
    },
    {
      "id": "personal",
      "title": "About you",
      "fields": [
        { "key": "name", "type": "text", "label": "Full name", "validation": { "required": true } },
        { "key": "birthDate", "type": "date", "label": "Date of birth" }
      ],
      "routes": [{ "to": "contact" }]
    },
    {
      "id": "contact",
      "title": "Contact",
      "back": { "label": "Edit details" },
      "fields": [
        { "key": "channel", "type": "select", "label": "Preferred channel", "defaultValue": "email", "options": [
          { "value": "email", "label": "Email" },
          { "value": "phone", "label": "Phone" }
        ] },
        {
          "key": "email",
          "type": "email",
          "label": "Email",
          "validation": { "required": true, "pattern": "^[^@\\s]+@[^@\\s]+$", "patternMessage": "Enter a valid email" }
        },
        {
          "key": "confirmEmail",
          "type": "email",
          "label": "Confirm email",
          "validation": { "required": true, "matchField": "email", "matchFieldMessage": "Emails must match" }
        },
        {
          "key": "phone",
          "type": "phone",
          "label": "Phone",
          "inputMode": "tel",
          "show": [{ "field": "channel", "eq": "phone" }],
          "validation": { "required": true }
        },
        { "key": "terms", "type": "checkbox", "label": "I accept the terms", "validation": { "required": "Accept the terms to continue" } }
      ]
    },
    {
      "id": "newsletter",
      "title": "Newsletter",
      "skip": { "label": "Not now" },
      "fields": [
        { "key": "subscribe", "type": "switch", "label": "Send me product news", "defaultValue": false },
        {
          "key": "topics",
          "type": "multiselect",
          "label": "Topics",
          "showAny": [{ "field": "subscribe", "eq": true }],
          "validation": { "required": "Pick at least one topic" },
          "options": [
            { "value": "product", "label": "Product updates" },
            { "value": "events", "label": "Events" }
          ]
        }
      ]
    }
  ]
}
```

With `accountType: "personal"`, the active path is `kind`, `personal`, `contact`, `newsletter`. Values entered earlier on `business` stay in `engine.values` and are not submitted. With `accountType: "waitlist"`, the first route ends the path at `kind`, and Submit appears there. Skipping `newsletter` submits without `subscribe` and `topics`.

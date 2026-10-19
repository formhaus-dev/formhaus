---
title: "Conditional fields"
description: "Show or hide fields and steps based on other answers with show and showAny conditions in JSON. AND/OR logic and cleanup of hidden values."
---

# Conditional Fields

Show or hide fields based on other field values. No code, just JSON.

## How it works

Add `show` or `showAny` to any field or step. Visibility re-evaluates on every value change.

- `show`: AND logic. All conditions must match.
- `showAny`: OR logic. At least one condition must match.
- Both set: `(all show) AND (any showAny)`.
- Neither set: field is always visible.

Hidden fields are not validated and not included in submit values.

## Operators

| Operator | JSON key | Matches when |
|----------|----------|-------------|
| Equals | `eq` | Value equals the given value |
| Not equals | `neq` | Value does not equal |
| In list | `in` | Value is one of the listed values |
| Not in list | `notIn` | Value is not in the list |
| Not empty | `notEmpty` | Value is not null, undefined, empty string, or empty array |
| Greater than | `gt` | Value is a number greater than the given number |
| At least | `gte` | Value is a number greater than or equal to the given number |
| Less than | `lt` | Value is a number less than the given number |
| At most | `lte` | Value is a number less than or equal to the given number |

Each condition uses exactly one operator. A condition with no operator or with two is a definition error.

`gt`, `gte`, `lt` and `lte` take a number. They also compare a numeric string, such as the `value` of a radio option `"9"`. Any other value, including an empty one, does not match.

## Example: NPS follow-up

Ask detractors what went wrong and promoters what they liked. A `scale` value is a number, so compare it with numbers:

```json
{
  "formatVersion": "1.3",
  "fields": [
    {
      "key": "score",
      "type": "scale",
      "label": "How likely are you to recommend us?",
      "validation": { "required": true, "min": 0, "max": 10 },
      "options": [
        { "value": "0", "label": "Not at all likely" },
        { "value": "10", "label": "Extremely likely" }
      ]
    },
    { "key": "problem", "type": "textarea", "label": "What went wrong?", "show": [{ "field": "score", "lte": 6 }] },
    { "key": "favorite", "type": "textarea", "label": "What did you like most?", "show": [{ "field": "score", "gte": 9 }] }
  ]
}
```

On `scale` and `rating`, `eq`, `neq`, `in` and `notIn` also take numbers: `{ "field": "score", "eq": 10 }`, not `"10"`. A string operand never matches, and `checkDefinition()` warns about it. `notEmpty` matches `0`. The anchor `options` are labels, not values, so a condition may test any point of the range.

## Example: show field when select changes

Show a details field only when category is "other":

```json
{
  "key": "otherDetails",
  "type": "text",
  "label": "Please specify",
  "show": [{ "field": "category", "eq": "other" }],
  "validation": { "required": true }
}
```

## Example: OR conditions

Show a field when payment method is credit card OR debit card:

```json
{
  "key": "cardNumber",
  "type": "text",
  "label": "Card Number",
  "showAny": [
    { "field": "paymentMethod", "eq": "credit" },
    { "field": "paymentMethod", "eq": "debit" }
  ]
}
```

Same thing, shorter with `in`:

```json
{
  "key": "cardNumber",
  "type": "text",
  "label": "Card Number",
  "show": [{ "field": "paymentMethod", "in": ["credit", "debit"] }]
}
```

## Example: AND + OR combined

Show a field when country is US AND method is credit or debit:

```json
{
  "key": "zipCode",
  "type": "text",
  "label": "Zip Code",
  "show": [{ "field": "country", "eq": "US" }],
  "showAny": [
    { "field": "method", "eq": "credit" },
    { "field": "method", "eq": "debit" }
  ]
}
```

## Hidden field cleanup

Hidden field values are removed during engine construction, after `reset()`, and whenever a dependency changes. Hidden values are not submitted.

When a hidden field shows again, it gets back its last value. A value the user cleared stays cleared. A field that never had a value, such as one that starts hidden, gets its initial value or `defaultValue`. Last values live in the engine, so a draft reopened through `initialValues` starts without them. See [Visibility](/spec#visibility).

If field A hides field B, and field B controls field C, the engine checks C next. It continues until no more fields or steps become hidden, with no fixed depth limit.

## Conditional steps

Steps support `show`/`showAny` too. Hidden steps are skipped during navigation. A step condition must reference fields of earlier steps, and a field condition fields of the same or an earlier step. The engine throws on a condition that references a later step, because conditions only see answers that come before them.

```json
{
  "id": "business-info",
  "title": "Business Information",
  "show": [{ "field": "accountType", "eq": "business" }],
  "fields": [
    { "key": "companyName", "type": "text", "label": "Company Name" }
  ]
}
```

If the user selects "personal" account type, this entire step disappears and the step counter updates.

## Conditional submit button

The default adapters evaluate `disabled` conditions on the top-level `submit` action and on the `next` action of a step:

```json
{
  "submit": {
    "label": "Submit",
    "disabled": [{ "field": "termsAccepted", "neq": true }]
  }
}
```

The submit button stays disabled until `termsAccepted` is `true`. All conditions must pass (AND logic) for the button to be disabled.

A step `next` with `disabled` keeps Continue disabled the same way. Custom action components can call `isActionDisabled(action, values)` from `@formhaus/core` to get the same result. The built-in adapters do not evaluate `disabled` for back, skip or cancel buttons.

## Next steps

- [Multi-Step Forms](/guide/steps): combine conditions with step navigation
- [Validation](/guide/validation): add validation rules alongside conditions
- [Examples](/guide/examples): conditional logic in practice

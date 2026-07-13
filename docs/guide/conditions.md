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
| Not empty | `notEmpty` | Value is not null, undefined, or empty string |

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

If field A hides field B, and field B controls field C, the engine checks C next. It continues until no more fields or steps become hidden, with no fixed depth limit.

## Conditional steps

Steps support `show`/`showAny` too. Hidden steps are skipped during navigation.

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

The default adapters evaluate `disabled` conditions on the top-level `submit` action:

```json
{
  "submit": {
    "label": "Submit",
    "disabled": [{ "field": "termsAccepted", "neq": true }]
  }
}
```

The submit button stays disabled until `termsAccepted` is `true`. All conditions must pass (AND logic) for the button to be disabled.

Other actions also expose `disabled` to custom action components, but the built-in adapters do not evaluate it for next, back, or cancel buttons.

## Next steps

- [Multi-Step Forms](/guide/steps): combine conditions with step navigation
- [Validation](/guide/validation): add validation rules alongside conditions
- [Examples](/guide/examples): conditional logic in practice

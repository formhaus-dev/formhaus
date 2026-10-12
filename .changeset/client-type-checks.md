---
"@formhaus/core": minor
---

- `validateSubmission(definition, values, { validators })` runs the named validators you pass. Validators you do not pass are still skipped.
- `validateSubmission()` reports an error under the `values` key when it receives the whole request body instead of the values.
- **Breaking:** `engine.validate()`, Continue and Submit run the server type checks in the browser: `email` format with a top-level domain and at most 254 characters, `date` and `datetime` shape, a finite number for `number`, booleans for `checkbox` and `switch`, static option values, and at most 10,000 characters of text. Values that `validateSubmission()` rejects are now rejected before submit. Store valid values, or use a custom field type for other formats.
- **Breaking:** `NaN`, `Infinity` and numeric strings in a `number` field fail with "Enter a number" instead of passing `min` and `max`. Write numbers with `setValue(key, Number(text))`.
- **Breaking:** an empty field with `matchField` fails when the field it matches has a value. Make the confirmation field `required` as well if you also want "This field is required".

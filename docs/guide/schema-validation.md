---
title: "Schema validation"
description: "Validate Formhaus forms with Zod, Valibot or ArkType through onValidate and schemaValidate: step scope, group items and async server checks."
---

# Schema Validation

`onValidate` checks the values after the definition rules pass. `schemaValidate()` from `@formhaus/core/schema` turns any [Standard Schema](https://standardschema.dev) into an `onValidate` function.

::: code-group
<<< @/recipes/snippets/schema-zod.ts [Zod]
<<< @/recipes/snippets/schema-valibot.ts [Valibot]
<<< @/recipes/snippets/schema-arktype.ts [ArkType]
:::

[Open in the playground](/play/schema#p=players)

Pass it to the renderer or the engine:

::: code-group
```tsx [React]
<FormRenderer definition={definition} onValidate={onValidate} onSubmit={send} />
```

```vue [Vue]
<FormRenderer :definition="definition" :on-validate="onValidate" @submit="send" />
```

```ts [Core]
const engine = new FormEngine(definition, {}, { onValidate });
```
:::

## Which issues show

- **Continue** checks the visible fields of the current step, so one schema covers the whole form.
- **Submit** checks the visible fields of every step on the path, except skipped steps. An issue on another step opens that step.
- The first issue of a field wins.
- An issue without a path shows as a form error. It clears on the next Continue, Back or Submit.
- An issue deeper than a field, such as one item of a `multiselect`, shows on that field.
- An issue on any other key is dropped: fields of other steps, fields hidden by a condition, skipped steps and keys that no field has. A misspelled schema key never shows an error, so check the keys against the definition.

## Empty answers

Keep `required` in the definition. Its rules run first, so an unanswered required field shows the definition message and the schema checks only answers.

A field nobody answered is missing from the values. A text field the user cleared is `''`. Mark every key the definition does not require as optional in the schema, and pass `emptyStrings: 'omit'` so a cleared field passes `.optional()` like an untouched one:

<<< @/recipes/snippets/schema-empty.ts

[Open in the playground](/play/schema#p=empty)

`'omit'` drops `''` at the top level and in group items, only from what the schema sees. The default, `'keep'`, passes `''` as it is.

## Built-in checks

Keep `required` and the field `type` in the definition, and check in the schema what the types do not, such as a work email domain. Each built-in type check has a message code, such as `email`, `number`, `date` or `option`. Set its wording in the [`messages` catalog](/guide/translations#messages-and-labels):

```json
{
  "messages": { "email": "Enter an email such as name@example.com" }
}
```

A `messages` function gets the field, so one field can have its own wording:

```ts
const messages: MessageFn = (code, _params, field) =>
  code === 'email' && field.key === 'workEmail' ? 'Enter your work email' : undefined;
```

## Checks across fields

An object-level check, such as Zod `.refine()` or ArkType `.narrow()`, runs only when every key of the object passes. On Continue the keys of later steps are missing, so mark the keys optional and keep `required` in the definition:

<<< @/recipes/snippets/schema-confirm.ts

[Open in the playground](/play/schema#p=confirm)

Zod `.refine()` with a `when` option and Valibot `partialCheck()` run a check on some keys while others fail.

## Group items

Issue paths map to group item keys: `['players', 1, 'name']` shows on `players.1.name`. The schema validates the group as an array of objects, as in the examples above. An issue on an item field that a condition hides is dropped.

## Async server check

An async refinement runs on Continue and Submit, never on each keystroke. The form stays busy until it resolves, and a result is dropped when the values or the step change in the meantime.

<<< @/recipes/snippets/schema-server-check.ts

[Open in the playground](/play/schema#p=server-check)

Zod runs the whole schema twice when a refinement is async: its Standard Schema `validate` tries a sync parse first, then parses again async. Valibot runs it once. The example caches the result per email, so each email is fetched once, also across Continue and Submit. A failed request lets the answer through and is tried again next time; the server checks the email again on submit.

## On the server

Call the function with the values alone. Each issue maps to the top-level key of its path, so `['players', 1, 'name']` shows on `players`, and an issue without a path comes back under the empty key `''`. Run it on the `values` that [`validateSubmission()`](/guide/server-validation) returns, which hold only the fields on the active path:

```ts
import { validateSubmission } from '@formhaus/core/server';

app.post('/api/submit', async (req, res) => {
  const { values, errors } = validateSubmission(definition, req.body?.values, {
    skippedSteps: req.body?.skippedSteps,
  });
  const allErrors = { ...(await onValidate(values)), ...errors };
  if (Object.keys(allErrors).length > 0) return res.status(422).json({ errors: allErrors });
  res.json({ values });
});
```

With a context, only issues on the paths in `fields` and issues without a path count. `fields: []` keeps only the issues without a path.

## Values and messages

- The submit handler gets the form values, not the schema output. Transforms, coercion and defaults in the schema do not apply. Parse the values again in the handler when you need the output.
- Schema messages come from the library, not from the Formhaus [locale catalogs](/guide/translations). Set the library locale with `z.config(z.locales.de())` in Zod or [`@valibot/i18n`](https://valibot.dev/guides/internationalization/) in Valibot, or pass your own messages as below.

## Messages in each language

Build the schema per language and pass the one for the active locale:

<<< @/recipes/snippets/schema-messages.ts

::: code-group
```tsx [React]
const onValidate = useMemo(() => validateIn(lang), [lang]);

<FormRenderer definition={definition} lang={lang} onValidate={onValidate} onSubmit={send} />
```

```vue [Vue]
<script setup lang="ts">
const onValidate = computed(() => validateIn(lang.value));
</script>

<template>
  <FormRenderer :definition="definition" :lang="lang" :on-validate="onValidate" @submit="send" />
</template>
```
:::

## Errors in one round

Set `validateWithRules` to run `onValidate` even when the definition rules fail. Both sets of errors show at once, and the definition error wins on a field that has both.

::: code-group
```tsx [React]
<FormRenderer definition={definition} onValidate={onValidate} validateWithRules onSubmit={send} />
```

```vue [Vue]
<FormRenderer :definition="definition" :on-validate="onValidate" validate-with-rules @submit="send" />
```

```ts [Core]
const engine = new FormEngine(definition, {}, { onValidate, validateWithRules: true });
```
:::

When the definition rules fail, Continue skips `onStepValidate` and `onBeforeStepChange`, and Submit skips `onBeforeSubmit` and the submit handler. `onValidate` still sees only the visible fields in scope.

## onValidate without a schema

`onValidate` gets the values and the field paths in scope. It returns errors keyed by field path, or `null` to pass. It may be async.

<<< @/recipes/snippets/on-validate.ts

[Open in the playground](/play/schema#p=on-validate)

```ts
type ValidateFn = (
  values: Record<string, unknown>,
  context: ValidateContext,
) => Record<string, string> | null | void | Promise<Record<string, string> | null | void>;

interface ValidateContext {
  stepId?: string;
  fields: string[];
  submit: boolean;
}
```

- `fields` lists the visible field paths in scope, with group items such as `players.0.name`.
- `stepId` is the current step. Single-step forms have none.
- `submit` is `true` on Submit and `false` on Continue.
- A key outside `fields`, or the empty key `''`, shows as a form error.

Continue runs the definition rules, then [`onStepValidate`](/guide/async-validation), then `onValidate`, then `onBeforeStepChange`. Submit runs the definition rules, then `onValidate`, then `onBeforeSubmit` and the submit handler. Back does not run it. Skip runs it only when it submits the form. `stepValidating` and `submitting` are `true` while it runs.

When `onValidate` throws or rejects, the step or the submit stops, as with `onBeforeSubmit`: `next()` and `submit()` reject, and renderers call `onError` or show the error at the form level when it is omitted.

[`ValidatorFn`](/guide/validation#custom-validators) stays synchronous. Use it for checks of one value.

---
title: "Schema validation"
description: "Check Formhaus values with Zod, Valibot or ArkType through onValidate and schemaValidate from @formhaus/core/schema: step scope, group items, async server checks."
---

# Schema Validation

`onValidate` checks the values after the definition rules pass. `schemaValidate()` from `@formhaus/core/schema` turns any [Standard Schema](https://standardschema.dev) into an `onValidate` function.

::: code-group
<<< @/recipes/snippets/schema-zod.ts [Zod]
<<< @/recipes/snippets/schema-valibot.ts [Valibot]
<<< @/recipes/snippets/schema-arktype.ts [ArkType]
:::

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

- **Continue** checks the visible fields of the current step. Issues of other steps are dropped, so one schema covers the whole form.
- **Submit** checks the visible fields of every step on the path, except skipped steps. An issue on another step opens that step.
- The first issue of a field wins.
- An issue without a path shows as a form error. It clears on the next Continue, Back or Submit.
- An issue deeper than a field, such as one item of a `multiselect`, shows on that field.

Fields that are optional in the definition or hidden by a condition can be missing from the values. Mark them optional in the schema, such as `z.string().optional()`, so an empty optional field passes.

## Group items

Issue paths map to group item keys: `['players', 1, 'name']` shows on `players.1.name`. The schema validates the group as an array of objects, as in the examples above. An issue on an item field that a condition hides is dropped.

## Async server check

An async refinement runs on Continue and Submit, never on each keystroke. The form stays busy until it resolves, and a result is dropped when the values or the step change in the meantime.

<<< @/recipes/snippets/schema-server-check.ts

## onValidate without a schema

`onValidate` gets the values and the field paths in scope. It returns errors keyed by field path, or `null` to pass. It may be async.

<<< @/recipes/snippets/on-validate.ts

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

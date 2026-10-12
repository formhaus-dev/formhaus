---
description: "FormEngine API reference: constructor, values, errors, visibility, step navigation, subscriptions and the submission lifecycle in @formhaus/core."
---

# FormEngine reference

`FormEngine` holds values, errors, visibility, and step state without depending on a UI framework.

## Constructor

```ts
import { FormEngine } from '@formhaus/core';

const engine = new FormEngine(definition, initialValues, {
  validators,
  onStepValidate,
  onBeforeStepChange,
  onAfterStepChange,
  onBeforeSubmit,
  onAfterSubmit,
  onWarning,
});
```

Both `initialValues` and the options object are optional. Pass a values type to get typed `values` and `getSubmitValues()`: `new FormEngine<{ email: string }>(definition)`. It defaults to `Record<string, unknown>`. Values belonging to hidden fields or hidden steps are removed during construction. In routed forms, skipped branch answers are retained as draft values; see [active-path values](/guide/steps#route-between-branches).

## Definition checks

The constructor runs `checkDefinition()`. It throws a `FormDefinitionError` when the definition has an issue with `severity: 'error'`, and passes each warning to `onWarning`. Without `onWarning`, warnings go to `console.warn` unless `process.env.NODE_ENV` is `production`.

```ts
import { checkDefinition, FormDefinitionError, parseDefinition } from '@formhaus/core';

const issues = checkDefinition(json);
const definition = parseDefinition(json);

try {
  new FormEngine(json);
} catch (error) {
  if (error instanceof FormDefinitionError) console.log(error.issues);
}
```

| Function | Returns | Description |
|---|---|---|
| `checkDefinition(input, { validators? })` | `DefinitionIssue[]` | Never throws. Errors come first. With `validators`, also reports `validator` names missing from it |
| `parseDefinition(input, { validators? })` | `FormDefinition` | Returns the input typed as `FormDefinition`, or throws `FormDefinitionError` with the errors |
| `validateDefinition(input)` | `string[]` | Deprecated. The messages of `checkDefinition()`. Removed in 1.0 |

```ts
interface DefinitionIssue {
  code: DefinitionIssueCode
  severity: 'error' | 'warning'
  path: string
  message: string
  hint?: string
}
```

`path` is a JSON pointer to the node, such as `/steps/0/routes/1/show/0/field`. `message` has the form `<path>: <what is wrong>. <how to fix>.` and `hint` holds the fix part. The codes are listed in the [specification](/spec#definition-checks).

## State

All state properties are read-only. Change values with `setValue()` and errors with `setErrors()`.

| Property | Type | Description |
|---|---|---|
| `values` | `Readonly<Partial<TValues>>` | Current draft values, including retained inactive branch answers in routed forms |
| `errors` | `Readonly<Record<string, string>>` | Errors attached to visible fields |
| `topLevelErrors` | `readonly string[]` | Errors for missing or hidden fields |
| `fieldLoading` | `Readonly<Record<string, boolean>>` | Per-field loading state |
| `stepValidating` | `boolean` | Whether async navigation, including validation and before/after hooks, is running |
| `submitting` | `boolean` | Whether submission validation, hooks or the submit handler are running |
| `currentStepIndex` | `number` | Zero-based index in the visible step list (active path when routes are enabled) |
| `visibleFields` | `FormField[]` | Visible fields on the current step, or all visible fields in a single-step form |
| `visibleSteps` | `FormStep[]` | Visible steps on the active path; without routes, all steps whose conditions pass |
| `currentStep` | `FormStep \| null` | Current visible step |
| `isFirstStep` / `isLastStep` | `boolean` | Current navigation position |
| `canGoNext` | `boolean` | Whether current-step validation passes |
| `progress` | `{ current: number; total: number }` | One-based progress through visible steps on the active path |
| `isMultiStep` | `boolean` | Whether the definition uses steps |

## Values and validation

| Method | Returns | Description |
|---|---|---|
| `setValue(key, value)` | `void` | Sets a value, clears its error, and reconciles dependent visibility |
| `setErrors(errors)` | `void` | Replaces existing errors and navigates to the first visible field with an error |
| `setFieldLoading(key, loading)` | `void` | Updates loading state for one field |
| `validate()` | `Record<string, string>` | Validates visible fields on the active path; skipped branch values are excluded |
| `validateField(key)` | `string \| null` | Validates one visible field |
| `getSubmitValues()` | `Partial<TValues>` | Returns visible field values on the active path, excluding inactive branch answers |
| `reset(values?)` | `void` | Resets values, errors, loading state, validation state, and navigation |

::: warning
`validate()` is the browser check. It runs the same type checks as the server for built-in types, but trusts the values your app put in the engine. On the server, use [`validateSubmission()`](/guide/server-validation).
:::

`reset()` also removes values hidden by the new reset values, while preserving answers in skipped route branches. Independently hidden fields still follow visibility clearing rules. Pending navigation and pre-submit results are discarded. A submission already dispatched cannot be undone.

A custom renderer that receives external errors as a prop can skip redundant `setErrors()` calls:

```ts
import { shouldApplyExternalErrors } from '@formhaus/core';

if (shouldApplyExternalErrors(engine, previousErrors, nextErrors)) engine.setErrors(nextErrors);
```

It returns `false` only when `nextErrors` equals `previousErrors` and the engine still shows every one of them. Pass `undefined` as `previousErrors` for a new engine.

## Navigation

`next()`, `back()`, `skip()` and `submit()` are async, run the lifecycle hooks and resolve to `true` when the action completed. While one of them is pending, the others resolve to `false`; call `cancelPendingActions()` to drop the pending one.

| Method | Returns | Description |
|---|---|---|
| `next()` | `Promise<boolean>` | Validates the current step, awaits `onStepValidate` and the step hooks, then advances |
| `back()` | `Promise<boolean>` | Runs the step hooks and moves to the previous step of the path without validation |
| `skip(submit?)` | `Promise<boolean>` | Runs the step hooks with `reason: 'skip'` and the pre-skip values, then resets the step and advances. When no step follows, it submits through `submit` without the step |
| `submit(handler)` | `Promise<boolean>` | Validates every step of the path, runs `onBeforeSubmit`, awaits `handler(values, skippedSteps)` and then `onAfterSubmit` |
| `isStepSkipped(stepId)` | `boolean` | Whether the step is skipped and left out of validation and submitted values |
| `goToStepWithField(key)` | `void` | Moves to the visible step containing a field without lifecycle hooks |

See [Async step validation](/guide/async-validation#using-the-engine-directly) for an `onStepValidate` example.

## Subscriptions

Use the general subscription when a consumer needs the entire engine state:

```ts
const unsubscribe = engine.subscribe(() => {
  render(engine.values, engine.errors);
});

const version = engine.getSnapshot();
```

For renderers, the granular subscriptions avoid updating unrelated fields:

| Method | Description |
|---|---|
| `subscribeField(key, listener)` | Runs the listener when that field's value, error, or loading state changes |
| `getFieldSnapshot(key)` | Returns that field's revision number |
| `subscribeStructure(listener)` | Runs the listener when visible fields, visible steps, or navigation changes |
| `getStructureSnapshot()` | Returns the structure revision number |

Each `subscribe` method returns an unsubscribe function. Snapshot methods return stable numbers until the corresponding state changes, so they can be passed to external-store APIs such as React's `useSyncExternalStore`.

## Navigation and submission lifecycle

`FormEngineOptions` additionally accepts `onBeforeStepChange`, `onAfterStepChange`, `onBeforeSubmit` and `onAfterSubmit`. Before-hooks may return `false` to cancel, synchronously or asynchronously. Step hooks receive `StepChangeContext`; submit hooks receive submission values.

These types are exported by `@formhaus/core`:

```ts
interface StepChangeContext {
  fromStepId: string
  toStepId: string
  reason: 'next' | 'back' | 'autoAdvance' | 'skip'
  values: Record<string, unknown>
}

type BeforeStepChangeFn = (context: StepChangeContext) => boolean | void | Promise<boolean | void>
type AfterStepChangeFn = (context: StepChangeContext) => void | Promise<void>
type BeforeSubmitFn = (values: Record<string, unknown>) => boolean | void | Promise<boolean | void>
type SubmitFn = (values: Record<string, unknown>, skippedSteps: string[]) => void | Promise<void>
```

`onAfterSubmit` and `submit(handler)` use `SubmitFn`. `reason` is `autoAdvance` when a renderer advances after an `autoAdvance` field commits. Callback values are shallow snapshots. For a complete Vue component and React usage, see [lifecycle hooks](/guide/steps#lifecycle-hooks).

| API | Result |
| --- | --- |
| `cancelPendingActions()` | Invalidates pending guards without clearing answers. Cannot undo a dispatched submission. |
| `submitting` | True while submission and its hooks are pending. |

A cancelled, invalid or concurrent action resolves to `false`. Exceptions reject. `FormLifecycleError` has `committed: true`, `phase` and `cause` for an after-hook failure: the action already completed. `stepValidating` remains true throughout navigation hooks. `setErrors()`, `goToStepWithField()` and `reset()` do not run the hooks. See [lifecycle ordering, recovery and adapter examples](../guide/steps#lifecycle-hooks).

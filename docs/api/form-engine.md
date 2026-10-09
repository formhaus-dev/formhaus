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
});
```

Both `initialValues` and the options object are optional. Values belonging to hidden fields or hidden steps are removed during construction. In routed forms, skipped branch answers are retained as draft values; see [active-path values](/guide/steps#route-between-branches).

## State

| Property | Type | Description |
|---|---|---|
| `values` | `Record<string, unknown>` | Current draft values, including retained inactive branch answers in routed forms |
| `errors` | `Record<string, string>` | Errors attached to visible fields |
| `topLevelErrors` | `string[]` | Errors for missing or hidden fields |
| `fieldLoading` | `Record<string, boolean>` | Per-field loading state |
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
| `getSubmitValues()` | `Record<string, unknown>` | Returns visible field values on the active path, excluding inactive branch answers |
| `reset(values?)` | `void` | Resets values, errors, loading state, validation state, and navigation |

`reset()` also removes values hidden by the new reset values, while preserving answers in skipped route branches. Independently hidden fields still follow visibility clearing rules. Pending navigation and pre-submit results are discarded. A submission already dispatched cannot be undone.

A custom renderer that receives external errors as a prop can skip redundant `setErrors()` calls:

```ts
import { shouldApplyExternalErrors } from '@formhaus/core';

if (shouldApplyExternalErrors(engine, previousErrors, nextErrors)) engine.setErrors(nextErrors);
```

It returns `false` only when `nextErrors` equals `previousErrors` and the engine still shows every one of them. Pass `undefined` as `previousErrors` for a new engine.

## Navigation

| Method | Returns | Description |
|---|---|---|
| `nextStep()` | `boolean` | Validates and advances without async validation or lifecycle hooks |
| `nextStepAsync(reason?)` | `Promise<boolean>` | Validates, awaits `onStepValidate` and navigation hooks; `reason` is `next` (default) or `autoAdvance` |
| `prevStep()` | `void` | Moves to the previous visible step without lifecycle hooks |
| `prevStepAsync()` | `Promise<boolean>` | Runs navigation hooks and moves back without forward validation |
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
  direction: 'next' | 'back'
  reason: 'next' | 'back' | 'autoAdvance'
  values: Record<string, unknown>
}

type BeforeStepChangeFn = (context: StepChangeContext) => boolean | void | Promise<boolean | void>
type AfterStepChangeFn = (context: StepChangeContext) => void | Promise<void>
type BeforeSubmitFn = (values: Record<string, unknown>) => boolean | void | Promise<boolean | void>
type SubmitFn = (values: Record<string, unknown>) => void | Promise<void>
```

`onAfterSubmit` and `submitAsync(handler)` use `SubmitFn`. Callback values are shallow snapshots. For a complete Vue component and React usage, see [lifecycle hooks](/guide/steps#lifecycle-hooks).

| API | Result |
| --- | --- |
| `nextStepAsync(reason = 'next')` | `Promise<boolean>`; validates and runs hooks. Renderers use `reason: 'autoAdvance'` for field activation. |
| `prevStepAsync()` | `Promise<boolean>`; runs hooks without forward validation. |
| `submitAsync(handler)` | `Promise<boolean>`; validates, runs the before-hook, awaits the handler and then the after-hook. |
| `cancelPendingActions()` | Invalidates pending guards without clearing answers. Cannot undo a dispatched submission. |
| `submitting` | True while submission and its hooks are pending. |

A cancelled, invalid or concurrent action resolves to `false`. Exceptions reject. `FormLifecycleError` has `committed: true`, `phase` and `cause` for an after-hook failure: the action already completed. `stepValidating` remains true throughout navigation hooks. Existing synchronous methods, error redirection and reset do not run async hooks. See [lifecycle ordering, recovery and adapter examples](../guide/steps#lifecycle-hooks).

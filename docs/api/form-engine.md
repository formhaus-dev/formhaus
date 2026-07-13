# FormEngine reference

`FormEngine` holds values, errors, visibility, and step state without depending on a UI framework.

## Constructor

```ts
import { FormEngine } from '@formhaus/core';

const engine = new FormEngine(definition, initialValues, {
  validators,
  onStepValidate,
});
```

Both `initialValues` and the options object are optional. Values belonging to hidden fields or hidden steps are removed during construction.

## State

| Property | Type | Description |
|---|---|---|
| `values` | `Record<string, unknown>` | Current field values |
| `errors` | `Record<string, string>` | Errors attached to visible fields |
| `topLevelErrors` | `string[]` | Errors for missing or hidden fields |
| `fieldLoading` | `Record<string, boolean>` | Per-field loading state |
| `stepValidating` | `boolean` | Whether `onStepValidate` is running |
| `currentStepIndex` | `number` | Zero-based index in the visible step list |
| `visibleFields` | `FormField[]` | Visible fields on the current step, or all visible fields in a single-step form |
| `visibleSteps` | `FormStep[]` | Steps whose conditions currently pass |
| `currentStep` | `FormStep \| null` | Current visible step |
| `isFirstStep` / `isLastStep` | `boolean` | Current navigation position |
| `canGoNext` | `boolean` | Whether current-step validation passes |
| `progress` | `{ current: number; total: number }` | One-based progress through visible steps |
| `isMultiStep` | `boolean` | Whether the definition uses steps |

## Values and validation

| Method | Returns | Description |
|---|---|---|
| `setValue(key, value)` | `void` | Sets a value, clears its error, and reconciles dependent visibility |
| `setErrors(errors)` | `void` | Replaces existing errors and navigates to the first visible field with an error |
| `setFieldLoading(key, loading)` | `void` | Updates loading state for one field |
| `validate()` | `Record<string, string>` | Validates all visible fields |
| `validateField(key)` | `string \| null` | Validates one visible field |
| `getSubmitValues()` | `Record<string, unknown>` | Returns values for visible fields only |
| `reset(values?)` | `void` | Resets values, errors, loading state, validation state, and navigation |

`reset()` also removes values hidden by the new reset values. Pending async step-validation results are discarded.

## Navigation

| Method | Returns | Description |
|---|---|---|
| `nextStep()` | `boolean` | Validates and advances without running `onStepValidate` |
| `nextStepAsync()` | `Promise<boolean>` | Validates, awaits `onStepValidate`, and advances when no errors are returned |
| `prevStep()` | `void` | Moves to the previous visible step |
| `goToStepWithField(key)` | `void` | Moves to the visible step containing a field |

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

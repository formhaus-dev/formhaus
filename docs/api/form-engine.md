---
title: "FormEngine API reference"
description: "FormEngine API reference: constructor, values, errors, visibility, step navigation, subscriptions and the submission lifecycle in @formhaus/core."
---

# FormEngine reference

`FormEngine` holds values, errors, visibility, and step state without depending on a UI framework.

## Constructor

```ts
import { FormEngine } from '@formhaus/core';

const engine = new FormEngine(definition, initialValues, {
  validators,
  messages,
  onStepValidate,
  onBeforeStepChange,
  onAfterStepChange,
  onBeforeSubmit,
  onAfterSubmit,
  onWarning,
  lang,
  formatRecall,
});
```

`lang` and `formatRecall` control how [recalled answers](/spec#answer-recall) look: `formatRecall(value, field, locale)` returns the text of one answer, and `lang` wins over `definition.lang`. Renderers take both as props.

`messages` is a [message catalog](/spec#message-and-label-catalogs) or a function `(key, params, field) => string | undefined`. It wins over `definition.messages` and is fixed for the lifetime of the engine. Both `initialValues` and the options object are optional. Pass a values type to get typed `values` and `getSubmitValues()`: `new FormEngine<{ email: string }>(definition)`. It defaults to `Record<string, unknown>`. Values belonging to hidden fields or hidden steps are removed during construction. In routed forms, skipped branch answers are retained as draft values; see [active-path values](/guide/steps#route-between-branches).

## Definition checks

The constructor runs `checkDefinition()`. It throws a `FormDefinitionError` when the definition has an issue with `severity: 'error'`, and passes each warning to `onWarning`. Without `onWarning`, warnings go to `console.warn`. In production builds, where `process.env.NODE_ENV` is `production`, and in a browser without a bundler, where `process` is not defined, the constructor runs only the error checks and reports no warnings. Call `checkDefinition()` to get warnings in production.

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
| `parseDefinition(input, { validators? })` | `FormDefinition` | Returns the input typed as `FormDefinition`, or throws `FormDefinitionError` with the errors. Ignores `validators`: a missing validator is a warning, and warnings never throw |

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

`@formhaus/core/fix` repairs definitions. The main entry does not include it. See [fixes](/spec#fixes) for the list.

| Function | Returns | Description |
|---|---|---|
| `suggestFixes(definition, issues?)` | `FixableIssue[]` | The issues with `fixes: { title, safe, patch }[]` where a repair is known. `patch` is an RFC 6902 JSON Patch |
| `applyFix(definition, patch)` | definition | A new definition with the patch applied. Throws when a path does not exist |
| `fixAll(definition)` | `{ definition, applied, issues }` | Applies every safe fix and returns the issues left |

## State

All state properties are read-only. Change values with `setValue()` and errors with `setErrors()`.

| Property | Type | Description |
|---|---|---|
| `values` | `Readonly<Partial<TValues>>` | Current draft values, including retained inactive branch answers in routed forms |
| `errors` | `Readonly<Record<string, string>>` | Client and server errors attached to visible fields on the active path. Item fields use [paths](#groups) |
| `topLevelErrors` | `readonly string[]` | Form-level errors: `formErrors` from a submit result and errors for unknown, hidden or off-path keys |
| `stepErrors` | `Record<string, string[]>` | Keys and item paths with errors, by step id, in form order, for steps on the active path that have errors |
| `fieldLoading` | `Readonly<Record<string, boolean>>` | Per-field loading state |
| `stepValidating` | `boolean` | Whether async navigation, including validation and before/after hooks, is running |
| `submitting` | `boolean` | Whether submission validation, hooks or the submit handler are running |
| `currentStepIndex` | `number` | Zero-based index in the visible step list (active path when routes are enabled) |
| `visibleFields` | `FormField[]` | Visible fields on the current step, or all visible fields in a single-step form. Section fields are listed in place, groups as one entry |
| `visibleNodes` | `FormNode[]` | Visible fields, sections and groups of the current step. A section holds only its visible fields. Added in 0.14.0 |
| `visibleSteps` | `FormStep[]` | Visible steps on the active path; without routes, all steps whose conditions pass |
| `currentStep` | `FormStep \| null` | Current visible step |
| `isFirstStep` / `isLastStep` | `boolean` | Current navigation position |
| `canGoNext` | `boolean` | Whether current-step validation passes |
| `progress` | `{ current: number; total: number }` | One-based progress through visible steps on the active path |
| `isMultiStep` | `boolean` | Whether the definition uses steps |

## Values and validation

| Method | Returns | Description |
|---|---|---|
| `setValue(key, value)` | `void` | Sets a value, clears its error, and reconciles dependent visibility. An item path such as `people.0.name` writes one item field |
| `setErrors(errors)` | `void` | Applies a server error set: replaces existing errors and opens the earliest step with a field error. See [server errors](/spec#server-errors) |
| `setFieldLoading(key, loading)` | `void` | Updates loading state for one field |
| `validate()` | `Record<string, string>` | Validates visible fields on the active path and returns the client errors. Unresolved server errors stay in `errors` |
| `validateField(key)` | `string \| null` | Validates one visible field. When it passes, it also removes the field's server error |
| `getSubmitValues()` | `Partial<TValues>` | Returns visible field values on the active path, excluding inactive branch answers |
| `reset(values?)` | `void` | Resets values, errors, loading state, validation state, and navigation |
| `replaceDefinition(definition)` | `void` | Switches to a new definition and keeps the answers, the step and the errors that still fit. Throws `FormDefinitionError` on an invalid definition and changes nothing |

::: warning
`validate()` is the browser check. It runs the same type checks as the server for built-in types, but trusts the values your app put in the engine. On the server, use [`validateSubmission()`](/guide/server-validation).
:::

`reset()` also removes values hidden by the new reset values, while preserving answers in skipped route branches. Independently hidden fields still follow visibility clearing rules. Pending navigation and pre-submit results are discarded. A submission already dispatched cannot be undone.

`replaceDefinition()` keeps the value of a field that has the same key and type in the new definition. A field whose type changed starts from its `defaultValue`, and values of removed fields are dropped. The current step stays when its id is still on the active path. Otherwise the engine moves to the last step before it on the old path that is still on the new path. Pending navigation and pre-submit results are discarded, like with `cancelPendingActions()`. See [Replacing the definition](/spec#replacing-the-definition).

A custom renderer that receives external errors as a prop can skip redundant `setErrors()` calls:

```ts
import { shouldApplyExternalErrors } from '@formhaus/core/internal';

if (shouldApplyExternalErrors(engine, previousErrors, nextErrors)) engine.setErrors(nextErrors);
```

It returns `false` only when `nextErrors` equals `previousErrors` and the engine still shows every one of them. Pass `undefined` as `previousErrors` for a new engine.

::: warning
`@formhaus/core/internal` holds the plumbing the React and Vue renderers share: `shouldApplyExternalErrors`, `autoAdvance`, `fieldDomId`, and the Cloud form controller (`createCloudController`, `initialCloudState`, `focusProblem`). It has no semver guarantee and can change in any release. Pin the exact `@formhaus/core` version if you import it.
:::

## Helpers

The main entry also exports the functions the engine uses for conditions and validation. They work on plain values, without an engine.

| Function | Returns | Description |
|---|---|---|
| `evaluateCondition(condition, values)` | `boolean` | Tests one [condition](/spec#conditions) against `values` |
| `isVisible(node, values)` | `boolean` | Applies the `show` and `showAny` conditions of a field, section, group or step |
| `isActionDisabled(action, values)` | `boolean` | Applies the `disabled` conditions of an action |
| `validateFieldValue(field, value, values, validators?, messages?)` | `string \| null` | The first error of one field, or `null` |
| `validateFields(nodes, values, validators?, messages?)` | `Record<string, string>` | Errors of the visible fields, sections and groups in `nodes`, by key or item path |
| `validateStep(step, values, validators?, messages?)` | `Record<string, string>` | `validateFields()` for the fields of one step |
| `recallText(definition, text, values, { item?, lang?, format?, engine? }?)` | `string` | Resolves the [recall tokens](/spec#answer-recall) of a text with the values from `getSubmitValues()`. Pass `engine` to follow its active path |
| `recallStatic(definition, text, group?)` | `string` | Replaces each recall token with the label of its field, for texts that stand for many submissions |
| `getDefaultMessage(rule, params?)` | `string` | The built-in English message of a rule or message key, such as `getDefaultMessage('minLength', { min: 3 })` |

`ValidationRule` is the type of the rule names: `required`, `minLength`, `maxLength`, `min`, `max`, `pattern` and `matchField`. `values` is the [active projection](/spec#visibility) the engine passes, such as `getSubmitValues()`.

## Groups

Added in 0.14.0. See [Repeatable groups](/guide/groups).

| Method | Returns | Description |
|---|---|---|
| `items(key)` | `GroupItem[]` | `{ id, fields }` for each item of a visible group: a stable id and the visible item fields |
| `addItem(key)` | `boolean` | Adds an item with the item field defaults. `false` at the maximum or for a hidden group |
| `removeItem(key, index)` | `boolean` | Removes an item and moves later item errors to their new index. `false` at the minimum or out of range |
| `setItemValue(key, index, field, value)` | `void` | Writes one item field. Same as `setValue('<key>.<index>.<field>', value)` |

Item errors use the path `<group>.<index>.<field>` with a 0-based index. `setErrors()`, `validateField()` and `goToStepWithField()` accept these paths.

```ts
import { isGroup, isSection } from '@formhaus/core';

for (const node of engine.visibleNodes) {
  if (isSection(node)) drawSection(node);
  else if (isGroup(node)) engine.items(node.key).forEach((item, index) => drawItem(node, index, item.fields));
  else drawField(node);
}
```

## Translations

`@formhaus/core/i18n` turns a definition and a translation into a plain definition for one language. The main entry does not include it.

```ts
import { localize, textSlots, translationIssues, translationTemplate } from '@formhaus/core/i18n';

const ru = localize(definition, { overlay, lang: 'ru' });
const de = localize(definition, { translate: (key, params, defaultText) => t(key, { ...params, defaultValue: defaultText }), prefix: false, lang: 'de' });
const engine = new FormEngine(de.definition, {}, { messages: de.messages });
```

| Export | Returns | Description |
|---|---|---|
| `localize(definition, { overlay, lang? })` | `{ definition, messages, labels }` | Applies an [overlay](/spec#overlays). `messages` and `labels` are the merged catalogs |
| `localize(definition, { translate, prefix?, lang? })` | `{ definition, messages, labels }` | Asks the [translate function](/spec#translate-function). `messages` and `labels` are functions for runtime texts |
| `translationTemplate(definition)` | overlay | Skeleton with the source texts as values |
| `textSlots(definition, { prefix? })` | `TextSlot[]` | `{ address, key, text, params, hash }` for every translatable text |
| `translationIssues(definition, overlay, meta?)` | `TranslationIssues` | `missing`, `unknown`, `invalid`, `placeholderMismatch`, `unlabeled`, and `stale` when `meta.slots` has hashes from `textSlots()`; pass the same `prefix` in `meta` |
| `checkTranslations(definition)` | `DefinitionIssue[]` | Checks `lang`, `messages`, `labels` and `i18n`. `localize()` throws on its errors |
| `defaultMessages`, `defaultLabels` | object | English templates |

`localize()` throws a `FormDefinitionError` for an invalid definition and never mutates its input. Pass `messages` and `labels` to the renderer, or spread the result:

```tsx
import { useLocalizedForm } from '@formhaus/react/i18n';

const form = useLocalizedForm(definition, { overlay, lang: 'ru' }, [extraDependency]);
<FormRenderer {...form} onSubmit={save} />
```

```ts
import { useLocalizedForm } from '@formhaus/vue/i18n';

const form = useLocalizedForm(() => definition, () => ({ overlay: overlay.value, lang: locale.value }));
```

The React hook recomputes when `definition`, `overlay`, `prefix`, `lang` or the extra dependencies change, not when `translate` changes. The Vue composable returns a computed ref and tracks reactive reads. Both return the definition unchanged without a source. A new result recreates the engine and clears the answers.

Renderers take `messages` and `labels` props with the same types as the engine option, and set `lang` from the definition on the `<form>` element.

## Navigation

`next()`, `back()`, `skip()` and `submit()` are async, run the lifecycle hooks and resolve to `true` when the action completed. While one of them is pending, the others resolve to `false`; call `cancelPendingActions()` to drop the pending one.

| Method | Returns | Description |
|---|---|---|
| `next()` | `Promise<boolean>` | Validates the current step, awaits `onStepValidate` and the step hooks, then advances |
| `back()` | `Promise<boolean>` | Runs the step hooks and moves to the previous step of the path without validation |
| `skip(submit?)` | `Promise<boolean>` | Runs the step hooks with `reason: 'skip'` and the pre-skip values, then resets the step and advances. When no step follows, it submits through `submit` without the step |
| `submit(handler)` | `Promise<boolean>` | Validates every step of the path, runs `onBeforeSubmit`, awaits `handler(values, skippedSteps)` and then `onAfterSubmit`. Resolves to `false` when the handler returns `{ ok: false }` |
| `isStepSkipped(stepId)` | `boolean` | Whether the step is skipped and left out of validation and submitted values |
| `goToStepWithField(key)` | `void` | Moves to the visible step containing a field without lifecycle hooks |
| `start()` | `void` | Reports `form_viewed` and the first `step_viewed`. Call it once the form is on screen. Later calls do nothing |

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
| `subscribeValues(listener)` | Runs the listener once per value-changing operation. Added in 0.16.0 |
| `getValuesSnapshot()` | Returns a frozen shallow copy of `values`, the same object until the next value change. Added in 0.16.0 |

Each `subscribe` method returns an unsubscribe function. Snapshot methods return stable values until the corresponding state changes, so they can be passed to external-store APIs such as React's `useSyncExternalStore`:

```ts
const values = useSyncExternalStore(
  (listener) => engine.subscribeValues(listener),
  () => engine.getValuesSnapshot(),
  () => engine.getValuesSnapshot(),
);
```

`subscribeValues` runs for `setValue`, group item changes, values cleared or restored by conditions, `reset`, and step skip and its rollback. It may run when the values end up unchanged: a write to a hidden field, a reset to equal content, a skip. It does not run for errors, loading, navigation or a value equal to the current one. Listeners run synchronously, after the general `subscribe` listeners.

## Form events

`onFormEvent` receives every lifecycle event as a `FormEvent`:

```ts
const engine = new FormEngine(definition, {}, { onFormEvent: (event) => console.log(event.type, event) });
engine.start();
```

The engine reports `form_viewed`, `step_viewed`, `step_completed`, `step_skipped`, `field_shown`, `field_hidden`, `field_error`, `form_submitted`, `form_submit_succeeded`, `form_submit_failed` and `form_reset`. `step_viewed` fires after `start()` for every change of the current step, including `goToStepWithField`, `reset`, `replaceDefinition` and a step that a condition hides. Before `start()`, `step_viewed`, visibility events and `form_reset` stay silent. The renderers call `start()` on mount and add `field_focused` and `field_blurred`. An error thrown by `onFormEvent` is rethrown in a microtask and does not interrupt the action. See the [event table](/guide/custom-components#form-events).

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
type SubmitResult =
  | { ok: true }
  | { ok: false; errors?: Record<string, string>; formErrors?: string[] }
type SubmitHandler = (
  values: Record<string, unknown>,
  skippedSteps: string[],
) => void | SubmitResult | Promise<void | SubmitResult>
```

`submit(handler)` and `skip(submit)` take a `SubmitHandler`; `onAfterSubmit` is a `SubmitFn`. Every `SubmitFn` is a valid `SubmitHandler`. The [submit results](/spec#submit-results) section of the specification defines success, rejection, the error rules and concurrent submissions. `reason` is `autoAdvance` when a renderer advances after an `autoAdvance` field commits. Callback values are shallow snapshots. For a complete Vue component and React usage, see [lifecycle hooks](/guide/steps#lifecycle-hooks).

| API | Result |
| --- | --- |
| `cancelPendingActions()` | Invalidates pending guards without clearing answers. Cannot undo a dispatched submission. |
| `submitting` | True while submission and its hooks are pending. |

A cancelled, invalid, rejected or concurrent action resolves to `false`. Exceptions reject. `FormLifecycleError` has `committed: true`, `phase` and `cause` for an after-hook failure: the action already completed. `stepValidating` remains true throughout navigation hooks. `setErrors()`, `goToStepWithField()` and `reset()` do not run the hooks. See [lifecycle ordering, recovery and adapter examples](../guide/steps#lifecycle-hooks).

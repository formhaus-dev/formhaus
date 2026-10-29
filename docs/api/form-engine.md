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
  locale,
  onStepValidate,
  onValidate,
  validateWithRules,
  onBeforeStepChange,
  onAfterStepChange,
  onBeforeSubmit,
  onAfterSubmit,
  onWarning,
  lang,
  formatRecall,
  seed,
  research,
  hiddenValues,
});
```

`hiddenValues` is `'clear'` (default) or `'keep'`. With `'keep'`, fields hidden by conditions keep their values in `values` and in `getSubmitValues()`. Conditions, validation and recall still treat them as unanswered. See [Keep hidden values](/guide/conditions#keep-hidden-values). Renderers take it as a prop. Added in 1.2.0.

`validateWithRules: true` runs `onValidate` even when the definition rules fail and shows both errors at once. See [Errors in one round](/guide/schema-validation#errors-in-one-round). Renderers take it as a prop. Added in 1.7.0.

`lang` and `formatRecall` control how [recalled answers](/spec#answer-recall) look: `formatRecall(value, field, locale)` returns the text of one answer, and `lang` wins over `definition.lang`. Renderers take both as props.

`research` from [`@formhaus/core/research`](/guide/research) turns on the [option order](/spec#option-order) of fields with `randomize`. `seed` sets that order. Without it, the research module generates one. Pass the same seed, such as a session id, to show a respondent the same order again and to render the same order on the server and the client. Renderers take both as props.

`messages` is a [message catalog](/spec#message-and-label-catalogs) or a function `(key, params, field) => string | undefined`. It wins over `definition.messages` and is fixed for the lifetime of the engine. `locale` takes a [locale source](#translations) or a list of them; it ranks above `definition.messages` and is read on every validation. Added in 1.3.0. Both `initialValues` and the options object are optional. Pass a values type to get typed `values` and `getSubmitValues()`: `new FormEngine<{ email: string }>(definition)`. It defaults to `Record<string, unknown>`. Values belonging to hidden fields or hidden steps are removed during construction, unless `hiddenValues` is `'keep'`. In routed forms, skipped branch answers are retained as draft values; see [active-path values](/guide/steps#route-between-branches).

## Definition checks

The constructor runs `checkDefinition()`. It throws a `FormDefinitionError` when the definition has an issue with `severity: 'error'`, and passes each warning to `onWarning`. Without `onWarning`, warnings go to `console.warn`. In production builds, where `process.env.NODE_ENV` is `production`, and in a browser without a bundler, where `process` is not defined, the constructor runs only the error checks and reports no warnings. Call `checkDefinition()` to get warnings in production. In production the `FormDefinitionError` from the constructor lists `path: code` for each issue. `checkDefinition()` and `parseDefinition()` give the full text in every build. In production it skips the error checks for a definition returned by `parseDefinition()`, and for every definition when `process.env.FORMHAUS_TRUSTED` is `"1"`. See [Trusted definitions](/guide/bundle-size#trusted-definitions).

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
| `parseDefinition(input)` | `FormDefinition` | Returns the input typed as `FormDefinition`, or throws `FormDefinitionError` with the errors. Warnings never throw |

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
| `seed` | `string` | The `seed` option, the seed the research module generated, or `''` without either. Added in 1.1.0 |

## Values and validation

| Method | Returns | Description |
|---|---|---|
| `setValue(key, value)` | `void` | Sets a value, clears its error, and reconciles dependent visibility. An item path such as `people.0.name` writes one item field |
| `setErrors(errors)` | `void` | Applies a server error set: replaces existing errors and opens the earliest step with a field error. See [server errors](/spec#server-errors) |
| `setFieldLoading(key, loading)` | `void` | Updates loading state for one field |
| `validate()` | `Record<string, string>` | Validates visible fields on the active path and returns the client errors. Unresolved server errors stay in `errors` |
| `validateField(key)` | `string \| null` | Validates one visible field. When it passes, it also removes the field's server error |
| `getSubmitValues()` | `Partial<TValues>` | Returns visible field values on the active path, excluding inactive branch answers. With `hiddenValues: 'keep'`, also the kept values |
| `reset(values?)` | `void` | Resets values, errors, loading state, validation state, and navigation |
| `orderOptions(key, options?)` | `FieldOption[]` | The options of a field in [shown order](/spec#option-order). `options` replaces the field's own list, such as a list from an options provider. For a group field, `key` is `group.field` or an item path. Without `research`, returns the written order. Added in 1.1.0 |
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
`@formhaus/core/internal` holds the plumbing the React and Vue renderers share: `shouldApplyExternalErrors`, `autoAdvance`, `fieldDomId`, and `focusProblem`, and the Cloud form controller in `@formhaus/core/internal/cloud` (`createCloudController`). It has no semver guarantee and can change in any release. Pin the exact `@formhaus/core` version if you import it.
:::

## Helpers

The main entry also exports the functions the engine uses for conditions and validation. They work on plain values, without an engine.

| Function | Returns | Description |
|---|---|---|
| `evaluateCondition(condition, values)` | `boolean` | Tests one [condition](/spec#conditions) against `values` |
| `isVisible(node, values)` | `boolean` | Applies the `show` and `showAny` conditions of a field, section, group or step |
| `isActionDisabled(action, values)` | `boolean` | Applies the `disabled` conditions of an action |
| `validateFieldValue(field, value, values, { validators?, messages? }?)` | `string \| null` | The first error of one field, or `null` |
| `validateFields(nodes, values, { validators?, messages? }?)` | `Record<string, string>` | Errors of the visible fields, sections and groups in `nodes`, by key or item path |
| `validateStep(step, values, { validators?, messages? }?)` | `Record<string, string>` | `validateFields()` for the fields of one step |
| `recallText(definition, text, values, { item?, lang?, format?, engine? }?)` | `string` | Resolves the [recall tokens](/spec#answer-recall) of a text with the values from `getSubmitValues()`. Pass `engine` to follow its active path |
| `recallStatic(definition, text, group?)` | `string` | Replaces each recall token with the label of its field, for texts that stand for many submissions |
| `getDefaultMessage(rule, params?)` | `string` | The built-in English message of a rule or message key, such as `getDefaultMessage('minLength', { min: 3 })` |

`getDefaultMessage` takes a `MessageKey`. `values` is the [active projection](/spec#visibility) the engine passes, such as `getSubmitValues()`.

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

The `locale` option takes one source or a list: a catalog such as `@formhaus/core/locales/ru`, a [translation file](/guide/translations#translation-files) with its `locale`, or `{ locale, translate, prefix? }`. The engine translates the texts of the form and resolves messages and labels from it. `engine.definition` is the translated definition. Renderers take `locale` as a prop, switch texts when it changes and keep the answers.

```ts
const engine = new FormEngine(definition, {}, { locale: [signupRu, ru] });
```

`@formhaus/core/i18n` has the tools for translation files and servers. The main entry does not include it.

```ts
import { localize, textSlots, translationIssues, translationTemplate } from '@formhaus/core/i18n';

const { definition: localized, messages } = localize(definition, [signupRu, ru]);
const { errors } = validateSubmission(localized, values, { messages });
```

| Export | Returns | Description |
|---|---|---|
| `localize(definition, locale)` | `{ definition, messages, labels }` | The translated definition and the `messages` and `labels` functions of the same sources as the `locale` option |
| `translationTemplate(definition)` | overlay | Skeleton with the source texts as values |
| `textSlots(definition, { prefix? })` | `TextSlot[]` | `{ address, key, text, params, hash }` for every translatable text |
| `translationIssues(definition, file, meta?)` | `TranslationIssues` | `missing`, `unknown`, `invalid`, `placeholderMismatch`, `unlabeled`, and `stale` when `meta.slots` has hashes from `textSlots()`; pass the same `prefix` in `meta` |
| `checkTranslations(definition)` | `DefinitionIssue[]` | Checks `lang`, `messages`, `labels` and `i18n`. `localize()` throws on its errors |
| `defaultMessages`, `defaultLabels` | object | English templates |
| `localeChain(tag)` | `string[]` | Fallback tags for a language, ending in `'en'`: `'ja-JP'` gives `['ja-JP', 'ja', 'en']` |
| `checkCatalog(catalog)` | `{ missing, unknown }` | Keys a [locale catalog](/guide/translations#languages) lacks or does not know |

`localize()` throws a `FormDefinitionError` for an invalid definition and never mutates its input.

## Navigation

`next()`, `back()`, `skip()` and `submit()` are async, run the lifecycle hooks and resolve to `true` when the action completed. While one of them is pending, the others resolve to `false`; call `cancelPendingActions()` to drop the pending one.

| Method | Returns | Description |
|---|---|---|
| `next()` | `Promise<boolean>` | Validates the current step, awaits `onStepValidate`, `onValidate` and the step hooks, then advances |
| `back()` | `Promise<boolean>` | Runs the step hooks and moves to the previous step of the path without validation |
| `skip(submit?)` | `Promise<boolean>` | Runs the step hooks with `reason: 'skip'` and the pre-skip values, then resets the step and advances. When no step follows, it submits through `submit` without the step |
| `submit(handler)` | `Promise<boolean>` | Validates every step of the path, runs `onValidate` and `onBeforeSubmit`, awaits `handler(values, skippedSteps)` and then `onAfterSubmit`. Resolves to `false` when the handler returns `{ ok: false }` |
| `isStepSkipped(stepId)` | `boolean` | Whether the step is skipped and left out of validation and submitted values |
| `goToStepWithField(key)` | `void` | Moves to the visible step containing a field without lifecycle hooks |
| `goToStep(stepId)` | `GoToStepResult` | Opens a step if the user could reach it. Otherwise opens the previous available step and reports it. See [Opening a step by id](/spec#opening-a-step-by-id) |
| `start()` | `void` | Reports `form_viewed` and the first `step_viewed`. Call it once the form is on screen. Later calls do nothing |

See [Async step validation](/guide/async-validation#using-the-engine-directly) for an `onStepValidate` example and [Schema validation](/guide/schema-validation) for `onValidate`.

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

The engine reports `form_viewed`, `step_viewed`, `step_completed`, `step_skipped`, `step_redirected`, `field_shown`, `field_hidden`, `field_error`, `form_submitted`, `form_submit_succeeded`, `form_submit_failed` and `form_reset`. `step_viewed` fires after `start()` for every change of the current step, including `goToStep`, `goToStepWithField`, `reset`, `replaceDefinition` and a step that a condition hides. Before `start()`, `step_viewed`, visibility events and `form_reset` stay silent. The renderers call `start()` on mount and add `field_focused` and `field_blurred`. An error thrown by `onFormEvent` is rethrown in a microtask and does not interrupt the action. See the [event table](/guide/custom-components#form-events).

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
type AfterSubmitFn = (values: Record<string, unknown>, skippedSteps: string[]) => void | Promise<void>
type SubmitResult =
  | { ok: true }
  | { ok: false; errors?: Record<string, string>; formErrors?: string[] }
type SubmitHandler = (
  values: Record<string, unknown>,
  skippedSteps: string[],
) => void | SubmitResult | Promise<void | SubmitResult>
```

`submit(handler)` and `skip(submit)` take a `SubmitHandler`; `onAfterSubmit` is an `AfterSubmitFn`. Every `AfterSubmitFn` is a valid `SubmitHandler`. The [submit results](/spec#submit-results) section of the specification defines success, rejection, the error rules and concurrent submissions. `reason` is `autoAdvance` when a renderer advances after an `autoAdvance` field commits. Callback values are shallow snapshots. For a complete Vue component and React usage, see [lifecycle hooks](/guide/steps#lifecycle-hooks).

| API | Result |
| --- | --- |
| `cancelPendingActions()` | Invalidates pending guards without clearing answers. Cannot undo a dispatched submission. |
| `submitting` | True while submission and its hooks are pending. |

A cancelled, invalid, rejected or concurrent action resolves to `false`. Exceptions reject. `FormLifecycleError` has `committed: true`, `phase` and `cause` for an after-hook failure: the action already completed. `stepValidating` remains true throughout navigation hooks. `setErrors()`, `goToStep()`, `goToStepWithField()` and `reset()` do not run the hooks. See [lifecycle ordering, recovery and adapter examples](../guide/steps#lifecycle-hooks).

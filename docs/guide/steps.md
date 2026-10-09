# Multi-Step Forms

Split a form into steps. The renderer handles navigation, progress, and per-step validation.

## Basic multi-step

Use `steps` instead of `fields` in the definition:

```json
{
  "id": "account-setup",
  "title": "Account Setup",
  "submit": { "label": "Create Account" },
  "steps": [
    {
      "id": "personal",
      "title": "Personal Information",
      "description": "Tell us about yourself",
      "fields": [
        { "key": "name", "type": "text", "label": "Full name", "validation": { "required": true } },
        { "key": "email", "type": "email", "label": "Email", "validation": { "required": true } }
      ]
    },
    {
      "id": "address",
      "title": "Address",
      "fields": [
        { "key": "street", "type": "text", "label": "Street", "validation": { "required": true } },
        { "key": "city", "type": "text", "label": "City", "validation": { "required": true } }
      ]
    },
    {
      "id": "confirm",
      "title": "Confirm",
      "fields": [
        { "key": "terms", "type": "checkbox", "label": "I accept the terms", "validation": { "required": "You must accept" } }
      ]
    }
  ]
}
```

## Navigation behavior

- **Continue** validates the current step. If valid, moves to the next visible step. If not, shows errors.
- **Back** goes to the previous visible step. No validation.
- **Submit** replaces Continue on the last visible step.
- **Progress bar** shows "Step N of M" based on visible steps.

## Custom labels per step

Override the Continue or Back button label on any step:

```json
{
  "id": "review",
  "title": "Review & Send",
  "back": { "label": "Edit Details" },
  "fields": [...]
}
```

Set `back` to `false` to hide the Back button on a step:

```json
{
  "id": "first-step",
  "title": "Welcome",
  "back": false,
  "fields": [...]
}
```

`variant` and `action` are available as metadata to custom action components. The built-in adapters use the resolved labels for step navigation.

## Conditional steps

Steps support `show`/`showAny` conditions, same as fields. Hidden steps are skipped, and their fields are not validated or submitted.

```json
{
  "id": "business-info",
  "title": "Business Details",
  "show": [{ "field": "accountType", "eq": "business" }],
  "fields": [
    { "key": "companyName", "type": "text", "label": "Company name" },
    { "key": "taxId", "type": "text", "label": "Tax ID" }
  ]
}
```

When the user picks "personal" instead of "business", this step vanishes. The progress bar updates from "Step 2 of 4" to "Step 2 of 3".

## Step change callback

::: code-group
```vue [Vue]
<template>
  <FormRenderer
    :definition="definition"
    @step-change="(stepId, direction) => console.log(stepId, direction)"
    @submit="onSubmit"
  />
</template>
```

```tsx [React]
<FormRenderer
  definition={definition}
  onStepChange={(stepId, direction) => console.log(stepId, direction)}
  onSubmit={handleSubmit}
/>
```
:::

`direction` is `'next'` or `'back'`.

## Async step validation

Need to check something on the server before advancing? See the [Async Step Validation](/guide/async-validation) guide.

## getSubmitValues

On submit, all visible fields across all visible steps are returned. Fields in hidden steps are excluded.

## Next steps

- [Async Step Validation](/guide/async-validation): server-side checks between steps
- [Conditional Fields](/guide/conditions): make steps and fields conditional
- [Error Handling](/guide/errors): handle errors from multi-step submissions
- [Custom Actions & Progress](/guide/custom-components): replace buttons and step progress with your own components
- [Examples](/guide/examples): multi-step patterns in practice

## Advance when an answer is activated

Set `autoAdvance: true` on a radio field. Clicking an option or pressing Space/Enter advances after validating the **whole current step**. Arrow keys select an answer without leaving the group. A double-click counts as one answer, so it cannot also answer the next question. Initial values, `setValue()`, hydration and rerenders never advance. Selecting a radio on the final step never submits.

```ts
import type { FormDefinition } from '@formhaus/core'

const definition: FormDefinition = {
  id: 'survey', title: 'Survey', submit: { label: 'Send' },
  steps: [
    {
      id: 'choice', title: 'Choose a plan', next: false,
      fields: [{
        key: 'plan', type: 'radio', label: 'Plan', autoAdvance: true,
        helperText: 'Click a plan or press Space/Enter to continue. Arrow keys only select.',
        validation: { required: true },
        options: [{ value: 'basic', label: 'Basic' }, { value: 'pro', label: 'Pro' }],
      }],
    },
    { id: 'review', title: 'Review', fields: [] },
  ],
}
```

`next: false` hides the built-in Next button; it does not forbid navigation and never hides the final Submit button. After a validation error or a cancelled/failed guard, activate the same selected option again to retry. Only hide Next when every user has an accessible way to retry. Keep Next for steps with several inputs or custom fields that do not support activation. Custom action components receive `showPrimary` and must honor it.

Custom React fields call `onChange(value)` for editing and `onCommit(value)` for intentional activation. Custom Vue fields emit `update:value` and `commit` respectively. `onCommit`/`commit` also saves the value; emit only one of them for an activation. For repeat clicks (`event.detail > 1`), call `event.preventDefault()` and skip the commit, so a double-click neither commits nor checks an option on the next step. The built-in radio supports this contract. Other built-in field types do not auto-advance.

## Lifecycle hooks

React `FormRenderer` and `HeadlessFormRenderer` accept the same hooks as `new FormEngine(definition, values, options)`:

```tsx
<FormRenderer
  definition={definition}
  onBeforeStepChange={async ({ fromStepId, toStepId, direction, values }) => {
    return await mayLeaveStep(fromStepId, toStepId, values) // false cancels
  }}
  onAfterStepChange={({ toStepId }) => trackStep(toStepId)}
  onBeforeSubmit={async (values) => await confirmSubmission(values)}
  onSubmit={async (values) => await save(values)}
  onAfterSubmit={() => showReceipt()}
  onError={(error) => showError(error)}
/>
```

Forward navigation runs field validation → `onStepValidate` → `onBeforeStepChange` → commit step → `onAfterStepChange`. Back runs the before/after hooks without field or server validation. Only an explicit `false` from a before-hook cancels; `void` allows the operation. Hooks may be synchronous or async. The step context includes `fromStepId`, `toStepId`, `direction` and `reason` (`next`, `back`, or `autoAdvance`). Before-hooks receive a shallow values snapshot. Errors reject core promises; renderers call `onError`, or display the error at the form level if it is omitted.

Submission runs whole-form validation → `onBeforeSubmit` → the awaited submit handler → `onAfterSubmit`. Only successful handlers reach the after-hook. `FormLifecycleError` identifies an after-hook failure with `committed: true`, `phase` and `cause`: navigation or submission already happened. Do not automatically retry a submission because its receipt/analytics hook failed. Inputs stay disabled until after-hooks resolve, so fire analytics without `await`.

`stepValidating` covers navigation hooks as well as server validation; `submitting` covers submission hooks and the handler. Repeated async actions are ignored until completion. Renderers disable input while waiting.

A hook may fill a value whose key was absent from the action's checked snapshot or whose snapshot value was `undefined`, for example a new `leadId`. An empty string (`''`), `null`, `false` and `0` count as existing values: replacing any of them with a different value cancels the pending action. For example, filling an omitted `leadId` is allowed, but replacing `leadId: ''` with `'lead-1'` cancels it. Allowed additions belong to that action: the step is revalidated before the transition commits, and submission sends the values present after `onBeforeSubmit`.

Changing a value the pending check already received, changing the active path, or resetting the core engine discards the pending pre-transition/pre-submit result. Reset cannot undo a submission already sent. `cancelPendingActions()` invalidates pending guards without clearing answers; adapters call it when their definition id changes or they unmount. Each operation captures its callbacks so changing props cannot redirect an old payload to a new handler.

Use `nextStepAsync()`, `prevStepAsync()` and `submitAsync(handler)` for lifecycle-aware core actions. Existing synchronous `nextStep()`, `prevStep()`, `goToStepWithField()`, error redirection and `reset()` remain low-level operations and do not call async lifecycle hooks. They can invalidate pending navigation. `onStepChange`/Vue `stepChange` still report committed Next/Back transitions before the after-hook.

Vue uses `:on-before-step-change`, `:on-after-step-change`, `:on-before-submit`, `:on-after-submit` and `:on-error` callback props. To await saving, pass `:submit-handler="save"`. The existing `@submit` event still fires after that handler succeeds; without `submitHandler`, after-submit means the event was dispatched. Vue event listeners cannot be awaited, so do not put the same network request in both places.

### Vue lifecycle example

This component accepts an application's `save` and `mayLeave` callbacks. `save` must return its request Promise and reject on failure; `mayLeave` may return `false` to cancel navigation. The form handles busy state while waiting.

```vue
<script setup lang="ts">
import { ref } from 'vue'
import { FormRenderer } from '@formhaus/vue'
import type { BeforeStepChangeFn, FormDefinition, StepChangeContext, SubmitFn } from '@formhaus/core'

const props = defineProps<{ save: SubmitFn; mayLeave: BeforeStepChangeFn }>()
const message = ref('')
const error = ref('')
const definition: FormDefinition = {
  id: 'survey', title: 'Survey', submit: { label: 'Send' },
  steps: [
    {
      id: 'choice', title: 'Choose a plan', next: false,
      fields: [{
        key: 'plan', type: 'radio', label: 'Plan', autoAdvance: true,
        helperText: 'Click or press Space/Enter to continue. Arrows only select.',
        validation: { required: true },
        options: [{ value: 'basic', label: 'Basic' }, { value: 'pro', label: 'Pro' }],
      }],
    },
    { id: 'review', title: 'Review', fields: [] },
  ],
}

function afterStep({ toStepId }: StepChangeContext) {
  message.value = `Opened ${toStepId}`
}
function beforeSubmit() {
  error.value = ''
  return window.confirm('Send these answers?')
}
function afterSubmit() {
  message.value = 'Saved'
}
function showError(cause: unknown) {
  error.value = cause instanceof Error ? cause.message : 'Could not finish the action'
}
</script>

<template>
  <FormRenderer
    :definition="definition"
    :on-before-step-change="props.mayLeave"
    :on-after-step-change="afterStep"
    :on-before-submit="beforeSubmit"
    :submit-handler="props.save"
    :on-after-submit="afterSubmit"
    :on-error="showError"
  />
  <p role="status">{{ message }}</p>
  <p v-if="error" role="alert">{{ error }}</p>
</template>
```

For `HeadlessFormRenderer`, pass these same callbacks along with your fields, actions and progress components. See the [custom activation and action contracts](/guide/custom-components#headless-renderer).

## Route between branches

`routes` keeps branching in the form definition alongside fields and visibility conditions:

```ts
import type { FormDefinition } from '@formhaus/core'

const definition: FormDefinition = {
  id: 'account', title: 'Account', submit: { label: 'Create account' },
  steps: [
    {
      id: 'kind', title: 'Account type', next: false,
      fields: [{
        key: 'kind', type: 'radio', label: 'Account type', autoAdvance: true,
        helperText: 'Click or press Space/Enter to continue; arrows only select.',
        validation: { required: true },
        options: [{ value: 'business', label: 'Business' }, { value: 'personal', label: 'Personal' }],
      }],
      routes: [
        { to: 'business', show: [{ field: 'kind', eq: 'business' }] },
        { to: 'personal' },
      ],
    },
    {
      id: 'business', title: 'Company',
      fields: [{ key: 'company', type: 'text', label: 'Company', validation: { required: true } }],
      routes: [{ to: 'review' }],
    },
    {
      id: 'personal', title: 'Your name',
      fields: [{ key: 'name', type: 'text', label: 'Name', validation: { required: true } }],
      routes: [{ to: 'review' }],
    },
    { id: 'review', title: 'Review', fields: [] },
  ],
}
```

Routes use the existing `show` (all conditions) and `showAny` (any condition) predicates. The first matching route whose target is visible wins. An unconditional last entry provides a fallback. If no route matches, navigation continues to the next visible step in declaration order. A hidden target is skipped while looking for a matching route; hiding the current target later recomputes the path. `to: null` ends the active path at the current step, where the Submit action appears. It does not send the form.

Targets must name a **later declared step**, or be `null`. Unknown, self and backward targets, duplicate step ids and missing/future route predicate fields are rejected when constructing the engine, and reported by `validateDefinition()`. The constructor throws, so a renderer given such a definition throws during render. Run `validateDefinition()` on JSON from a CMS or Figma before rendering it. This forward-only model prevents cycles. Use Back for returning to previous steps.

Both branch exits in the example explicitly converge at `review`. Without the business exit route, the normal next step would be `personal`, so both branches would run. List the full intended path, including convergence, in your definition. `validateDefinition()` warns when a branch target has no unconditional route and its next declared step is a sibling target.

The active path is computed from current answers, beginning at the first step. `visibleSteps`, `currentStepIndex`, `progress`, `isLastStep` and validation use that path. Fallbacks and progress are provisional before the routing answers are filled. Back returns to the previous step on the current path, without a separate visit-history stack. If changed answers remove the current step, the engine immediately returns to the nearest surviving predecessor from the old path; if the current step still belongs to the new path, it stays there. This reconciliation cannot be vetoed. Like reset/error redirection, it emits structure subscriptions, not navigation lifecycle hooks; observe `subscribeStructure()` for every structural change.

Routing is opt-in. With no nonempty `routes` arrays, existing visibility, payload and validation behavior is unchanged. With routes, answers in skipped branches remain in `engine.values` for returning to that branch, but do not enter submission, validation or lifecycle value snapshots. Route and step-visibility predicates see only visible answers from the active steps already encountered. Field visibility can also use other fields in its current step. Retained answers in skipped branches cannot select a new route. Put routing/visibility dependencies on earlier steps or the same step's fields, not on future steps. Existing `show`/`showAny` hiding still clears hidden answers; retaining a skipped branch is not a guarantee that a separately hidden field will be retained.

Hooks and validators receive the active visible field values; submission receives that same projection. General `onFieldChange`/Vue `fieldChange`, option providers and direct `engine.values` access still receive retained form state. Treat that state as a draft, not as the submission payload. JSON serialization and the Figma definition parser preserve routes and `autoAdvance`. The [Figma plugin](/guide/figma) draws routed forms as a flow map with an arrow per route.

---
title: "Use Formhaus with Svelte 5"
description: "Render a Formhaus JSON form in Svelte 5 with runes: a FormEngine wrapper component with steps, branching routes, skip, validation errors and async submit."
---

# How do I use Formhaus with Svelte 5?

There is no Svelte adapter. A small runes component renders `FormEngine` from `@formhaus/core`.

```bash
npm install @formhaus/core
```

## Definition

<<< @/recipes/definitions/project-inquiry.json

## Component

`FormhausForm.svelte` bumps a `$state` counter on every engine change, and `$derived` reads the engine again:

```svelte
<script lang="ts">
  import { FormEngine, type FormDefinition, type SubmitFn } from '@formhaus/core';

  let { definition, onsubmit }: { definition: FormDefinition; onsubmit: SubmitFn } = $props();

  const engine = $derived(new FormEngine(definition));
  let version = $state(0);
  $effect(() => engine.subscribe(() => version++));

  const view = $derived.by(() => {
    version;
    return {
      step: engine.currentStep,
      fields: engine.visibleFields,
      values: { ...engine.values },
      errors: { ...engine.errors },
      busy: engine.stepValidating || engine.submitting,
      first: engine.isFirstStep,
      last: engine.isLastStep,
    };
  });

  const value = (key: string) => (view.values[key] ?? '') as string;

  function primary(event: SubmitEvent) {
    event.preventDefault();
    if (view.last) engine.submitAsync(onsubmit);
    else engine.nextStepAsync();
  }
</script>

<form onsubmit={primary} novalidate>
  {#if view.step}<h2>{view.step.title}</h2>{/if}

  {#each view.fields as field (field.key)}
    <div>
      {#if field.type === 'radio'}
        <fieldset>
          <legend>{field.label}</legend>
          {#each field.options ?? [] as option}
            <label>
              <input type="radio" name={field.key} value={option.value} checked={view.values[field.key] === option.value}
                onchange={() => engine.setValue(field.key, option.value)} />
              {option.label}
            </label>
          {/each}
        </fieldset>
      {:else if field.type === 'checkbox' || field.type === 'switch'}
        <label>
          <input type="checkbox" role={field.type === 'switch' ? 'switch' : undefined} checked={view.values[field.key] === true}
            onchange={(e) => engine.setValue(field.key, e.currentTarget.checked)} />
          {field.label}
        </label>
      {:else}
        <label for={field.key}>{field.label}</label>
        {#if field.type === 'select'}
          <select id={field.key} value={value(field.key)} onchange={(e) => engine.setValue(field.key, e.currentTarget.value)}>
            <option value="" disabled>{field.placeholder ?? 'Select…'}</option>
            {#each field.options ?? [] as option}<option value={option.value}>{option.label}</option>{/each}
          </select>
        {:else if field.type === 'textarea'}
          <textarea id={field.key} value={value(field.key)} oninput={(e) => engine.setValue(field.key, e.currentTarget.value)}></textarea>
        {:else if field.type === 'number'}
          <input id={field.key} type="number" value={value(field.key)}
            oninput={(e) => engine.setValue(field.key, e.currentTarget.value === '' ? '' : e.currentTarget.valueAsNumber)} />
        {:else}
          <input id={field.key} type={field.type === 'email' ? 'email' : 'text'} value={value(field.key)}
            oninput={(e) => engine.setValue(field.key, e.currentTarget.value)} />
        {/if}
      {/if}
      {#if view.errors[field.key]}<p role="alert">{view.errors[field.key]}</p>{/if}
    </div>
  {/each}

  {#if !view.first && view.step?.back !== false}
    <button type="button" disabled={view.busy} onclick={() => engine.prevStepAsync()}>{view.step?.back?.label ?? 'Back'}</button>
  {/if}
  {#if view.step?.skip}<button type="button" disabled={view.busy} onclick={() => engine.skipStepAsync(onsubmit)}>{view.step.skip.label}</button>{/if}
  <button type="submit" disabled={view.busy}>{view.last ? definition.submit.label : 'Continue'}</button>
</form>
```

## Usage

```svelte
<script lang="ts">
  import type { FormDefinition } from '@formhaus/core';
  import FormhausForm from './FormhausForm.svelte';
  import json from './project-inquiry.json';

  const definition = json as FormDefinition;
  let sent = $state<Record<string, unknown> | null>(null);

  async function submit(values: Record<string, unknown>, skippedSteps?: string[]) {
    await fetch('/api/inquiry', { method: 'POST', body: JSON.stringify({ values, skippedSteps }) });
    sent = values;
  }
</script>

{#if sent}
  <pre>{JSON.stringify(sent, null, 2)}</pre>
{:else}
  <FormhausForm {definition} onsubmit={submit} />
{/if}
```

## How it works

- `engine.subscribe()` returns the unsubscribe function, so `$effect` cleans it up.
- `nextStepAsync()` validates the current step and follows `routes`. `submitAsync(onsubmit)` validates every visible step and calls `onsubmit(values, skippedSteps)`.
- `skipStepAsync(onsubmit)` skips a step with `skip`, and submits when it is the last step.
- `stepValidating` and `submitting` are `true` while navigation or the submit handler runs; the buttons are disabled then.
- `number` fields store a number, or `''` when empty. Checkbox and switch store booleans.
- Add `multiselect`, `file` and custom types the same way: call `engine.setValue(field.key, value)` with the value shape from [Field Types](/guide/fields).

## Related

- [Headless engine](/recipes/headless-engine): the same engine in plain JavaScript
- [FormEngine reference](/api/form-engine): every property and method
- [Multi-step with branching](/recipes/multi-step-branching): the same definition in React and Vue

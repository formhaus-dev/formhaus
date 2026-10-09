---
title: "Use the form engine without React or Vue"
description: "Run Formhaus forms without React or Vue: the FormEngine class in @formhaus/core handles values, validation, visibility and steps in plain JavaScript."
---

# How do I use the form engine without React or Vue?

Install `@formhaus/core` and create a `FormEngine` from the JSON definition. The engine has no dependencies and no UI: it holds values and errors, evaluates `show` conditions, validates, and moves between steps. Your code renders `engine.visibleFields`, calls `engine.setValue()` on input, and re-renders when the engine notifies a subscriber. The same definition works with the React and Vue renderers.

```bash
npm install @formhaus/core
```

## Definition

<<< @/recipes/definitions/newsletter.json

## Vanilla JavaScript

```html
<form id="newsletter" novalidate></form>
<script type="module" src="./main.js"></script>
```

```js
import { FormEngine } from '@formhaus/core';
import definition from './newsletter.json';

const engine = new FormEngine(definition);
const form = document.getElementById('newsletter');
const errorNodes = new Map();

function control(field) {
  if (field.type === 'select') {
    const select = document.createElement('select');
    for (const option of field.options) select.add(new Option(option.label, option.value));
    select.value = engine.values[field.key] ?? '';
    select.onchange = () => engine.setValue(field.key, select.value);
    return select;
  }
  const input = document.createElement('input');
  input.type = field.type;
  if (field.type === 'checkbox') {
    input.checked = engine.values[field.key] === true;
    input.onchange = () => engine.setValue(field.key, input.checked);
  } else {
    input.value = engine.values[field.key] ?? '';
    input.oninput = () => engine.setValue(field.key, input.value);
  }
  return input;
}

function row(field) {
  const label = document.createElement('label');
  const error = document.createElement('small');
  errorNodes.set(field.key, error);
  label.append(field.label, control(field), error);
  return label;
}

function showErrors() {
  for (const [key, node] of errorNodes) node.textContent = engine.errors[key] ?? '';
}

function render() {
  errorNodes.clear();
  const submit = document.createElement('button');
  submit.textContent = definition.submit.label;
  form.replaceChildren(...engine.visibleFields.map(row), submit);
  showErrors();
}

engine.subscribeStructure(render);
engine.subscribe(showErrors);
render();

form.addEventListener('submit', async (event) => {
  event.preventDefault();
  await engine.submitAsync(async (values) => {
    await fetch('/api/subscribe', { method: 'POST', body: JSON.stringify(values) });
  });
});
```

## Multi-step forms

For a definition with `steps`, render `engine.currentStep` and call the navigation methods from your buttons:

```js
const engine = new FormEngine(definition, {}, {
  onAfterStepChange: ({ toStepId }) => console.log('step', toStepId),
});

await engine.nextStepAsync();
await engine.prevStepAsync();
await engine.skipStepAsync();

const { current, total } = engine.progress;
const label = engine.isLastStep ? definition.submit.label : 'Continue';
```

## How it works

- `new FormEngine(definition, initialValues, options)` builds the state. `options` takes `validators`, `onStepValidate` and the before and after lifecycle hooks.
- `subscribeStructure()` fires when visible fields, visible steps or the current step change. Rebuilding the DOM only then keeps focus in text inputs while the user types.
- `subscribe()` fires on every change, including errors. `showErrors()` updates the error text in place.
- `setValue()` clears the field's error and re-evaluates `show` conditions, removing values of fields that become hidden.
- `submitAsync(handler)` validates the visible fields, runs `onBeforeSubmit`, awaits the handler, then runs `onAfterSubmit`. It resolves to `false` and fills `engine.errors` when validation fails.
- `getSubmitValues()` returns the visible values on the active path, the same payload the handler receives.
- `subscribeField(key, listener)` and the snapshot methods let a renderer update one field at a time.

## Svelte

The [Svelte example](https://github.com/ignsm/formhaus/tree/main/examples/vanilla-svelte) renders a definition with `@formhaus/core` and no adapter. Open it in the [playground](/playground#svelte) to edit the definition and see the result.

## Related

- [FormEngine reference](/api/form-engine): every property, method and subscription
- [Custom Actions & Progress](/guide/custom-components#headless-renderer): `HeadlessFormRenderer` for React and Vue with your own components
- [Getting Started](/guide/): install and package overview
- [Definition Reference](/api/definition): the JSON format

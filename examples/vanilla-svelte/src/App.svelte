<script>
  import { FormEngine } from "@formhaus/core";
  import definition from "./definition.json";

  const STEP_SEPARATOR = ' \u2014 ';

  const engine = new FormEngine(definition);

  let fields = engine.visibleFields.slice();
  let values = Object.assign({}, engine.values);
  let errors = Object.assign({}, engine.errors);
  let isMultiStep = engine.isMultiStep;
  let currentStep = engine.currentStep;
  let isFirstStep = engine.isFirstStep;
  let isLastStep = engine.isLastStep;

  function sync() {
    fields = engine.visibleFields.slice();
    values = Object.assign({}, engine.values);
    errors = Object.assign({}, engine.errors);
    isMultiStep = engine.isMultiStep;
    currentStep = engine.currentStep;
    isFirstStep = engine.isFirstStep;
    isLastStep = engine.isLastStep;
  }

  engine.subscribe(() => sync());

  function handleFieldChange(key, value) {
    engine.setValue(key, value);
    sync();
  }

  function handleNext() {
    engine.nextStep();
    sync();
  }

  function handleBack() {
    engine.prevStep();
    sync();
  }

  function handleSubmit() {
    if (isMultiStep && !isLastStep) {
      handleNext();
      return;
    }
    const result = engine.validate();
    sync();
    if (Object.keys(result).length === 0) {
      console.log("Submitted:", engine.getSubmitValues());
    }
  }
</script>

<div style="max-width: 480px; margin: 24px auto; font-family: sans-serif">
  <h2>{definition.title}</h2>
  {#if isMultiStep && currentStep}
    <p style="color: #666; margin: 0 0 12px">{currentStep.title}{currentStep.description ? STEP_SEPARATOR + currentStep.description : ''}</p>
  {/if}
  {#each fields as field}
    <div style="margin-bottom: 12px">
      <label for={field.key}>{field.label}</label>
      <br />
      {#if field.type === 'select'}
        <select id={field.key} on:change={e => handleFieldChange(field.key, e.target.value)}>
          <option value="">{field.placeholder ?? 'Select...'}</option>
          {#each field.options ?? [] as opt}
            <option value={opt.value}>{opt.label}</option>
          {/each}
        </select>
      {:else if field.type === 'checkbox'}
        <label><input type="checkbox" checked={values[field.key] ?? false} on:change={e => handleFieldChange(field.key, e.target.checked)} /> {field.label}</label>
      {:else if field.type === 'radio'}
        {#each field.options ?? [] as opt}
          <label style="display: block"><input type="radio" name={field.key} value={opt.value} checked={values[field.key] === opt.value} on:change={e => handleFieldChange(field.key, opt.value)} /> {opt.label}</label>
        {/each}
      {:else if field.type === 'switch'}
        <label><input type="checkbox" role="switch" checked={values[field.key] ?? false} on:change={e => handleFieldChange(field.key, e.target.checked)} /> {field.label}</label>
      {:else if field.type === 'textarea'}
        <textarea id={field.key} rows={field.rows ?? 3} placeholder={field.placeholder ?? ''} on:input={e => handleFieldChange(field.key, e.target.value)}>{values[field.key] ?? ''}</textarea>
      {:else}
        <input
          id={field.key}
          type={field.type === 'email' ? 'email' : field.type === 'password' ? 'password' : field.type === 'number' ? 'number' : 'text'}
          placeholder={field.placeholder ?? ''}
          value={values[field.key] ?? ''}
          on:input={e => handleFieldChange(field.key, e.target.value)}
        />
      {/if}
      {#if field.helperText && !errors[field.key]}
        <p style="color: #666; margin: 4px 0 0; font-size: 13px">{field.helperText}</p>
      {/if}
      {#if errors[field.key]}
        <p style="color: red; margin: 4px 0 0; font-size: 13px">{errors[field.key]}</p>
      {/if}
    </div>
  {/each}
  <div style="display: flex; gap: 8px; margin-top: 16px">
    {#if isMultiStep && !isFirstStep}
      <button on:click={handleBack}>Back</button>
    {/if}
    <button on:click={handleSubmit}>{isMultiStep && !isLastStep ? 'Continue' : definition.submit.label}</button>
  </div>
</div>

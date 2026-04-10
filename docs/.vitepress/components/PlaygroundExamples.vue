<script setup lang="ts">
import { ref, computed } from 'vue';
import { Sandpack } from 'sandpack-vue3';

const fixtures: Record<string, object> = {
  'Basic Form': {"id":"basic-form","title":"Contact Information","submit":{"label":"Submit"},"fields":[{"key":"firstName","type":"text","label":"First Name","placeholder":"Enter your first name","validation":{"required":true,"minLength":2}},{"key":"lastName","type":"text","label":"Last Name","placeholder":"Enter your last name","validation":{"required":true}},{"key":"email","type":"email","label":"Email Address","placeholder":"you@example.com","validation":{"required":true,"pattern":"^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$","patternMessage":"Please enter a valid email address"}},{"key":"country","type":"select","label":"Country","placeholder":"Select a country","options":[{"value":"US","label":"United States"},{"value":"MX","label":"Mexico"},{"value":"CA","label":"Canada"},{"value":"BR","label":"Brazil"},{"value":"IN","label":"India"}],"validation":{"required":true}}]},
  'Conditional Fields': {"id":"conditional-fields","title":"Payment Details","submit":{"label":"Continue"},"fields":[{"key":"paymentMethod","type":"select","label":"Payment Method","options":[{"value":"bank","label":"Bank Transfer"},{"value":"card","label":"Credit/Debit Card"},{"value":"crypto","label":"Cryptocurrency"}],"validation":{"required":true}},{"key":"cardNumber","type":"text","label":"Card Number","show":[{"field":"paymentMethod","eq":"card"}],"validation":{"required":true},"inputMode":"numeric"},{"key":"cardExpiry","type":"text","label":"Expiry (MM/YY)","placeholder":"MM/YY","show":[{"field":"paymentMethod","eq":"card"}],"validation":{"required":true}},{"key":"walletAddress","type":"text","label":"Wallet Address","show":[{"field":"paymentMethod","eq":"crypto"}],"validation":{"required":true}},{"key":"cryptoNetwork","type":"select","label":"Network","show":[{"field":"paymentMethod","eq":"crypto"}],"options":[{"value":"ethereum","label":"Ethereum"},{"value":"tron","label":"Tron"},{"value":"solana","label":"Solana"}],"validation":{"required":true}}]},
  'Multi-Step': {"id":"multi-step","title":"Account Setup","submit":{"label":"Create Account"},"steps":[{"id":"personal","title":"Personal Information","description":"Tell us about yourself","fields":[{"key":"firstName","type":"text","label":"First Name","validation":{"required":true}},{"key":"lastName","type":"text","label":"Last Name","validation":{"required":true}},{"key":"email","type":"email","label":"Email","validation":{"required":true}},{"key":"phone","type":"phone","label":"Phone Number","inputMode":"tel"}]},{"id":"address","title":"Address","description":"Where do you live?","fields":[{"key":"street","type":"text","label":"Street Address","validation":{"required":true}},{"key":"city","type":"text","label":"City","validation":{"required":true}},{"key":"state","type":"text","label":"State / Province"},{"key":"zipCode","type":"text","label":"ZIP / Postal Code","validation":{"required":true}},{"key":"country","type":"select","label":"Country","options":[{"value":"US","label":"United States"},{"value":"MX","label":"Mexico"},{"value":"CA","label":"Canada"}],"validation":{"required":true}}]},{"id":"preferences","title":"Preferences","description":"Customize your experience","fields":[{"key":"newsletter","type":"checkbox","label":"Subscribe to newsletter","defaultValue":true},{"key":"notifications","type":"radio","label":"Notification preference","options":[{"value":"email","label":"Email"},{"value":"sms","label":"SMS"},{"value":"none","label":"None"}],"defaultValue":"email"},{"key":"darkMode","type":"switch","label":"Dark mode"}]}]},
  'Validation': {"id":"validation-form","title":"Account Registration","submit":{"label":"Create Account"},"fields":[{"key":"username","type":"text","label":"Username","placeholder":"Choose a username","validation":{"required":true,"minLength":3,"maxLength":20,"pattern":"^[a-zA-Z0-9_]+$","patternMessage":"Only letters, numbers, and underscores"}},{"key":"email","type":"email","label":"Email","validation":{"required":true,"pattern":"^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$","patternMessage":"Please enter a valid email"}},{"key":"password","type":"password","label":"Password","helperText":"At least 8 characters","validation":{"required":true,"minLength":8,"minLengthMessage":"Password must be at least 8 characters"}},{"key":"confirmPassword","type":"password","label":"Confirm Password","validation":{"required":true,"matchField":"password","matchFieldMessage":"Passwords do not match"}},{"key":"age","type":"number","label":"Age","validation":{"required":true,"min":18,"minMessage":"You must be at least 18 years old","max":120}}]},
};

const selectedReact = ref('Basic Form');
const selectedVue = ref('Basic Form');
const selectedSvelte = ref('Basic Form');

function reactFiles(fixture: string) {
  const definition = JSON.stringify(fixtures[fixture], null, 2);
  return {
    'App.tsx': `import { FormRenderer } from "@formhaus/react";

const definition = ${definition};

export default function App() {
  return (
    <div style={{ maxWidth: 480, margin: "24px auto", fontFamily: "sans-serif" }}>
      <FormRenderer
        definition={definition}
        onSubmit={(values) => console.log("Submitted:", values)}
      />
    </div>
  );
}`,
  };
}

function vueFiles(fixture: string) {
  const definition = JSON.stringify(fixtures[fixture], null, 2);
  return {
    'src/App.vue': `<` + `script setup>
import { FormRenderer } from "@formhaus/vue";

const definition = ${definition};

function onSubmit(values) {
  console.log("Submitted:", values);
}
</` + `script>

<template>
  <div style="max-width: 480px; margin: 24px auto; font-family: sans-serif">
    <FormRenderer :definition="definition" @submit="onSubmit" />
  </div>
</template>`,
  };
}

function svelteFiles(fixture: string) {
  const definition = JSON.stringify(fixtures[fixture], null, 2);
  return {
    'App.svelte': `<` + `script>
  // No adapter needed. This shows how to use @formhaus/core directly.
  // The engine handles validation, visibility, and multi-step navigation.
  // You only write the rendering.
  import { FormEngine } from "@formhaus/core";

  const definition = ${definition};
  const engine = new FormEngine(definition);

  let fields = engine.visibleFields.slice();
  let vals = Object.assign({}, engine.values);
  let errs = Object.assign({}, engine.errors);
  let multi = engine.isMultiStep;
  let step = engine.currentStep;
  let first = engine.isFirstStep;
  let last = engine.isLastStep;

  function sync() {
    fields = engine.visibleFields.slice();
    vals = Object.assign({}, engine.values);
    errs = Object.assign({}, engine.errors);
    multi = engine.isMultiStep;
    step = engine.currentStep;
    first = engine.isFirstStep;
    last = engine.isLastStep;
  }

  engine.subscribe(() => sync());

  function setValue(key, value) {
    engine.setValue(key, value);
    sync();
  }

  function next() {
    engine.nextStep();
    sync();
  }

  function back() {
    engine.prevStep();
    sync();
  }

  function submit() {
    if (multi && !last) {
      next();
      return;
    }
    const result = engine.validate();
    sync();
    if (Object.keys(result).length === 0) {
      console.log("Submitted:", engine.getSubmitValues());
    }
  }
</` + `script>

<div style="max-width: 480px; margin: 24px auto; font-family: sans-serif">
  <h2>{definition.title}</h2>
  {#if multi && step}
    <p style="color: #666; margin: 0 0 12px">{step.title}{step.description ? ' — ' + step.description : ''}</p>
  {/if}
  {#each fields as field}
    <div style="margin-bottom: 12px">
      <label for={field.key}>{field.label}</label>
      <br />
      {#if field.type === 'select'}
        <select id={field.key} on:change={e => setValue(field.key, e.target.value)}>
          <option value="">{field.placeholder || 'Select...'}</option>
          {#each field.options || [] as opt}
            <option value={opt.value}>{opt.label}</option>
          {/each}
        </select>
      {:else if field.type === 'checkbox'}
        <label><input type="checkbox" checked={vals[field.key] || false} on:change={e => setValue(field.key, e.target.checked)} /> {field.label}</label>
      {:else if field.type === 'radio'}
        {#each field.options || [] as opt}
          <label style="display: block"><input type="radio" name={field.key} value={opt.value} checked={vals[field.key] === opt.value} on:change={e => setValue(field.key, opt.value)} /> {opt.label}</label>
        {/each}
      {:else if field.type === 'switch'}
        <label><input type="checkbox" role="switch" checked={vals[field.key] || false} on:change={e => setValue(field.key, e.target.checked)} /> {field.label}</label>
      {:else if field.type === 'textarea'}
        <textarea id={field.key} rows={field.rows || 3} placeholder={field.placeholder || ''} on:input={e => setValue(field.key, e.target.value)}>{vals[field.key] || ''}</textarea>
      {:else}
        <input
          id={field.key}
          type={field.type === 'email' ? 'email' : field.type === 'password' ? 'password' : field.type === 'number' ? 'number' : 'text'}
          placeholder={field.placeholder || ''}
          value={vals[field.key] || ''}
          on:input={e => setValue(field.key, e.target.value)}
        />
      {/if}
      {#if field.helperText && !errs[field.key]}
        <p style="color: #666; margin: 4px 0 0; font-size: 13px">{field.helperText}</p>
      {/if}
      {#if errs[field.key]}
        <p style="color: red; margin: 4px 0 0; font-size: 13px">{errs[field.key]}</p>
      {/if}
    </div>
  {/each}
  <div style="display: flex; gap: 8px; margin-top: 16px">
    {#if multi && !first}
      <button on:click={back}>Back</button>
    {/if}
    <button on:click={submit}>{multi && !last ? 'Continue' : definition.submit.label}</button>
  </div>
</div>`,
  };
}

const props = defineProps<{ framework: 'react' | 'vue' | 'svelte' }>();

const selected = ref('Basic Form');

const templates = { react: 'react-ts', vue: 'vue3-ts', svelte: 'svelte' } as const;
const fileFns = { react: reactFiles, vue: vueFiles, svelte: svelteFiles };
const deps = {
  react: { '@formhaus/core': '0.3.1', '@formhaus/react': '0.3.1', 'react': '18.3.1', 'react-dom': '18.3.1' },
  vue: { '@formhaus/core': '0.3.1', '@formhaus/vue': '0.3.1' },
  svelte: { '@formhaus/core': '0.3.1', 'svelte': '3.59.2' },
};
const heights = { react: 480, vue: 480, svelte: 520 };
</script>

<template>
  <div>
    <div class="fh-playground-tabs">
      <button
        v-for="name in Object.keys(fixtures)"
        :key="name"
        :class="['fh-playground-tab', { active: selected === name }]"
        @click="selected = name"
      >{{ name }}</button>
    </div>
    <Sandpack
      :key="framework + '-' + selected"
      :template="templates[framework]"
      :files="fileFns[framework](selected)"
      :options="{ showConsole: true, editorHeight: heights[framework] }"
      :custom-setup="{ dependencies: deps[framework] }"
    />
  </div>
</template>

<style scoped>
.fh-playground-tabs {
  display: flex;
  gap: 6px;
  margin-bottom: 12px;
  flex-wrap: wrap;
}
.fh-playground-tab {
  padding: 4px 12px;
  font-size: 13px;
  border: 1px solid var(--vp-c-border);
  border-radius: 6px;
  background: var(--vp-c-bg);
  color: var(--vp-c-text-2);
  cursor: pointer;
}
.fh-playground-tab.active {
  border-color: var(--vp-c-brand-1);
  color: var(--vp-c-brand-1);
  background: var(--vp-c-brand-soft);
}
</style>

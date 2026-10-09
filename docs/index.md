---
layout: home
title: "Formhaus — JSON form definition for React, Vue, Figma and AI agents"
titleTemplate: false
description: "Define fields, validation, conditional visibility and multi-step routes in one JSON form definition. Render it in React, Vue or Figma."
---

<script setup>
import LandingHero from './.vitepress/components/landing/LandingHero.vue';
import LandingDemo from './.vitepress/components/landing/LandingDemo.vue';
import LandingTabs from './.vitepress/components/landing/LandingTabs.vue';
import LandingFigma from './.vitepress/components/landing/LandingFigma.vue';
import LandingAgents from './.vitepress/components/landing/LandingAgents.vue';
import LandingRecipes from './.vitepress/components/landing/LandingRecipes.vue';
import './.vitepress/components/landing/landing.css';
</script>

<LandingHero />

<LandingDemo />

<LandingTabs>
<template #react>

```tsx
import { FormRenderer } from '@formhaus/react';
import '@formhaus/core/style.css';
import definition from './onboarding.json';

export function Onboarding() {
  return <FormRenderer definition={definition} onSubmit={(values) => save(values)} />;
}
```

</template>
<template #vue>

```vue
<script setup lang="ts">
import { FormRenderer } from '@formhaus/vue';
import '@formhaus/core/style.css';
import definition from './onboarding.json';
</script>

<template>
  <FormRenderer :definition="definition" @submit="save" />
</template>
```

</template>
<template #headless>

```ts
import { FormEngine } from '@formhaus/core';
import definition from './onboarding.json';

const engine = new FormEngine(definition);
engine.setValue('whoIsItFor', 'my-team');
await engine.nextStepAsync();

engine.setValue('company', 'Acme');
engine.setValue('teamSize', '11-50');
await engine.nextStepAsync();

engine.setValue('workEmail', 'team@acme.dev');
await engine.submitAsync(save);
```

</template>
<template #figma>

<img src="/figma/hero.png" alt="The Formhaus Figma plugin editing a branching account form next to its flow map on the canvas" width="2400" height="1240" loading="lazy" decoding="async">

Paste the same JSON into the plugin.

</template>
</LandingTabs>

<LandingFigma />

<LandingAgents>

```json
{
  "$schema": "https://formhaus.dev/schema/form-definition.json"
}
```

</LandingAgents>

<LandingRecipes />

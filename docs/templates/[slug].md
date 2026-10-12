---
layout: page
sidebar: false
pageClass: lp-page
---

<script setup>
import TemplateDetail from '../.vitepress/components/templates/TemplateDetail.vue'
</script>

<TemplateDetail>

<div class="vp-doc">

## Use it with the npm packages

Copy the JSON into a file in your app, install the renderer and pass the definition to it. The same JSON works with `@formhaus/vue`.

```sh
npm i @formhaus/core @formhaus/react
```

```tsx
import { FormRenderer } from '@formhaus/react';
import '@formhaus/core/style.css';
import definition from './form.json';

export function Form() {
  return (
    <FormRenderer
      definition={definition}
      onSubmit={(values) => console.log(values)}
    />
  );
}
```

See [Getting started](/guide/) for validation, steps and custom components.

</div>

</TemplateDetail>

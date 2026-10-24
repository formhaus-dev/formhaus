---
title: Schema playground
description: "Run schemaValidate with Zod, Valibot or ArkType on a live Formhaus form. Edit the schema or the definition and see the errors that Continue and Submit return."
layout: false
---

<script setup>
import SchemaApp from '../.vitepress/components/schema-play/SchemaApp.vue';
</script>

<h1 class="play-sr">Formhaus schema playground</h1>

<ClientOnly>
  <SchemaApp />
</ClientOnly>

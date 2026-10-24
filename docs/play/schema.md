---
title: Schema playground
description: "Run schemaValidate with Zod, Valibot or ArkType on a live Formhaus form, edit the schema and the definition, and see the errors each Continue and Submit returns."
layout: false
---

<script setup>
import SchemaApp from '../.vitepress/components/schema-play/SchemaApp.vue';
</script>

<h1 class="play-sr">Formhaus schema playground</h1>

<ClientOnly>
  <SchemaApp />
</ClientOnly>

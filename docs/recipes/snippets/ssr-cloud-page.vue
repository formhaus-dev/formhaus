<script setup lang="ts">
import { fetchForm } from '@formhaus/core/cloud';
import { FormhausForm } from '@formhaus/vue/cloud';

const { data: form } = await useAsyncData('contact-form', () => fetchForm({ id: 'YOUR_FORM_ID' }).catch(() => null));
</script>

<template>
  <FormhausForm id="YOUR_FORM_ID" :initial-form="form ?? undefined" />
</template>

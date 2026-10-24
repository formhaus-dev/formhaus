<script setup lang="ts">
import { formErrorsComponentProps } from '@formhaus/vue';
import Message from 'primevue/message';

defineProps(formErrorsComponentProps);
</script>

<template>
  <Message severity="error" :pt="{ root: rootProps }">
    <p v-for="message in errors" :key="message" class="summary__step">{{ message }}</p>
  </Message>
</template>

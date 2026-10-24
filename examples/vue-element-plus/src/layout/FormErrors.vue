<script setup lang="ts">
import { formErrorsComponentProps } from '@formhaus/vue';
import { ElAlert } from 'element-plus';

defineProps(formErrorsComponentProps);
</script>

<template>
  <div v-bind="rootProps" class="summary">
    <ElAlert v-for="message in errors" :key="message" type="error" :title="message" :closable="false" show-icon />
  </div>
</template>

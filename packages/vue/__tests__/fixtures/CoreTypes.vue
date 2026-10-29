<script setup lang="ts">
import type { DefinitionIssueCode, ErrorSummary, FormField, FormGroup, FormSection } from '@formhaus/core';

defineProps<{ code: DefinitionIssueCode; summary: ErrorSummary; group: FormGroup; section: FormSection; field: FormField }>();
</script>

<template>
  <div />
</template>

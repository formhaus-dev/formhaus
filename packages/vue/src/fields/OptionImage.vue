<script setup lang="ts">
import type { FieldOption } from '@formhaus/core';

defineProps<{ option: FieldOption }>();
</script>

<template>
  <img v-if="option.image" class="fh-field__option-image" :src="option.image" alt="" loading="lazy" decoding="async" />
</template>

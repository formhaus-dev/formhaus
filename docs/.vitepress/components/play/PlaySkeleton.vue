<script setup lang="ts">
import './play-skeleton.css';

defineProps<{ label: string }>();
</script>

<template>
  <div class="play-skeleton" role="status">
    <span class="visually-hidden">{{ label }}</span>
    <div class="play-skeleton__form" aria-hidden="true">
      <span class="play-skeleton__bar play-skeleton__bar--progress" />
      <span class="play-skeleton__bar play-skeleton__bar--title" />
      <span class="play-skeleton__bar play-skeleton__bar--lead" />
      <span v-for="row in 3" :key="row" class="play-skeleton__field">
        <span class="play-skeleton__bar play-skeleton__bar--label" />
        <span class="play-skeleton__input" />
      </span>
      <span class="play-skeleton__bar play-skeleton__bar--button" />
    </div>
  </div>
</template>

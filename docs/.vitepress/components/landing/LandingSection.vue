<script setup lang="ts">
const props = defineProps<{ id: string; eyebrow?: string; title?: string; lead?: string; band?: boolean }>();
</script>

<template>
  <section :class="['lp-section', { 'lp-section--band': props.band }]" :aria-labelledby="props.title ? `${props.id}-title` : undefined">
    <div class="lp-container">
      <header v-if="props.title" class="lp-head">
        <p v-if="props.eyebrow" class="lp-eyebrow">{{ props.eyebrow }}</p>
        <h2 :id="`${props.id}-title`" class="lp-title">{{ props.title }}</h2>
        <p v-if="props.lead || $slots.lead" class="lp-lead"><slot name="lead">{{ props.lead }}</slot></p>
      </header>
      <slot />
    </div>
  </section>
</template>

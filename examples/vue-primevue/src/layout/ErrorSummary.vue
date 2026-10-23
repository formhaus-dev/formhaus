<script setup lang="ts">
import { errorSummaryComponentProps } from '@formhaus/vue';
import Message from 'primevue/message';

defineProps(errorSummaryComponentProps);
</script>

<template>
  <Message severity="error" :pt="{ root: { ...rootProps, class: 'summary' } }">
    <strong class="summary__title">{{ title }}</strong>
    <template v-for="group in groups" :key="group.id">
      <p v-if="groups.length > 1" class="summary__step">{{ group.title }}</p>
      <ul class="summary__list">
        <li v-for="entry in group.entries" :key="entry.key">
          <a :href="`#${entry.id}`" @click.prevent="showField(entry.key)">{{ entry.text }}</a>
        </li>
      </ul>
    </template>
  </Message>
</template>

<script setup lang="ts">
import { groupItemComponentProps } from '@formhaus/vue';

const props = defineProps(groupItemComponentProps);
</script>

<template>
  <div data-fh-group-item>
    <span :id="props.titleId" tabindex="-1">{{ props.title }}</span>
    <component :is="props.fields" />
    <button v-if="props.canRemove" type="button" :aria-label="props.removeName" @click="props.remove">x</button>
  </div>
</template>

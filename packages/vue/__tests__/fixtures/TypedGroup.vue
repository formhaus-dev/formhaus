<script setup lang="ts">
import { groupComponentProps } from '@formhaus/vue';

const props = defineProps(groupComponentProps);
</script>

<template>
  <div :id="props.id">
    <span>{{ props.label }}: {{ props.items.length }}</span>
    <component :is="props.itemComponent" v-for="item in props.items" :key="item.id" v-bind="item" />
    <button v-if="props.canAdd" type="button" data-fh-group-add :disabled="props.disabled" @click="props.add">{{ props.addLabel }}</button>
  </div>
</template>

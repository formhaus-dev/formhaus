<script setup>
defineProps({
  rootProps: { type: Object, required: true },
  title: { type: String, required: true },
  groups: { type: Array, required: true },
  count: { type: Number, required: true },
  showField: { type: Function, required: true },
});
</script>

<template>
  <v-alert v-bind="rootProps" type="error" variant="tonal" :title="title" class="mb-4">
    <div v-for="group in groups" :key="group.id">
      <div v-if="groups.length > 1" class="font-weight-medium mt-1">{{ group.title }}</div>
      <ul class="pl-5">
        <li v-for="entry in group.entries" :key="entry.key">
          <a :href="`#${entry.id}`" class="text-error" @click.prevent="showField(entry.key)">{{ entry.text }}</a>
        </li>
      </ul>
    </div>
  </v-alert>
</template>

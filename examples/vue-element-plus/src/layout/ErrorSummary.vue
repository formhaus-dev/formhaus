<script setup lang="ts">
import { errorSummaryComponentProps } from '@formhaus/vue';
import { ElAlert, ElLink } from 'element-plus';

defineProps(errorSummaryComponentProps);
</script>

<template>
  <div v-bind="rootProps" class="summary">
    <ElAlert type="error" :title="title" :closable="false" show-icon>
      <template v-for="group in groups" :key="group.id">
        <p v-if="groups.length > 1" class="summary__step">{{ group.title }}</p>
        <ul class="summary__list">
          <li v-for="entry in group.entries" :key="entry.key">
            <ElLink type="danger" underline="always" :href="`#${entry.id}`" @click.prevent="showField(entry.key)">{{ entry.text }}</ElLink>
          </li>
        </ul>
      </template>
    </ElAlert>
  </div>
</template>

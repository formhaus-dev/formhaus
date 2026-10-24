<script setup lang="ts">
import { ElButton, ElDescriptions, ElDescriptionsItem, ElResult } from 'element-plus';
import { computed, onBeforeUnmount, ref } from 'vue';
import { answers, completion, type CompletionProps } from '../answers';

const props = defineProps<Omit<CompletionProps, 'onRestart'>>();
const emit = defineEmits<{ restart: [] }>();
const rows = computed(() => answers(props.definition, props.values));
const query = window.matchMedia('(max-width: 575px)');
const narrow = ref(query.matches);
const update = (event: MediaQueryListEvent) => {
  narrow.value = event.matches;
};
query.addEventListener('change', update);
onBeforeUnmount(() => query.removeEventListener('change', update));
</script>

<template>
  <ElResult icon="success" :title="completion.title" :sub-title="completion.body" role="status">
    <template #extra>
      <ElButton type="primary" @click="emit('restart')">{{ completion.again }}</ElButton>
    </template>
  </ElResult>
  <ElDescriptions :title="completion.answers" :column="1" :direction="narrow ? 'vertical' : 'horizontal'" border class="completion__answers">
    <ElDescriptionsItem v-for="row in rows" :key="row.key" :label="row.label" label-class-name="completion__label">
      {{ row.value }}
    </ElDescriptionsItem>
  </ElDescriptions>
</template>

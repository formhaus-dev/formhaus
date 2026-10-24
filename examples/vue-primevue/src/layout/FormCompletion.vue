<script setup lang="ts">
import Button from 'primevue/button';
import Message from 'primevue/message';
import { computed } from 'vue';
import { answers, completion, type CompletionProps } from '../answers';

const props = defineProps<Omit<CompletionProps, 'onRestart'>>();
const emit = defineEmits<{ restart: [] }>();
const rows = computed(() => answers(props.definition, props.values));
</script>

<template>
  <div class="completion">
    <Message severity="success" role="status">
      <h2 class="completion__title">{{ completion.title }}</h2>
      <p class="completion__body">{{ completion.body }}</p>
    </Message>
    <h3 class="completion__heading">{{ completion.answers }}</h3>
    <dl class="completion__answers">
      <div v-for="row in rows" :key="row.key" class="completion__row">
        <dt>{{ row.label }}</dt>
        <dd>{{ row.value }}</dd>
      </div>
    </dl>
    <Button :label="completion.again" severity="secondary" outlined @click="emit('restart')" />
  </div>
</template>

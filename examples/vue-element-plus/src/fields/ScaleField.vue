<script setup lang="ts">
import { fieldComponentEmits, fieldComponentProps } from '@formhaus/vue';
import { ElRadioButton, ElRadioGroup } from 'element-plus';
import { computed } from 'vue';
import FieldShell from './FieldShell.vue';
import { describedBy, scalePoints } from './field';

const props = defineProps(fieldComponentProps);
const emit = defineEmits(fieldComponentEmits);
const id = computed(() => props.id ?? props.field.key);
const scale = computed(() => scalePoints(props.field));

function pick(value: string | number | boolean | undefined) {
  if (props.field.autoAdvance) emit('commit', value);
  else emit('update:modelValue', value);
}
</script>

<template>
  <FieldShell :id="id" :field="field" :error="error" kind="group">
    <div class="scale">
      <ElRadioGroup
        :id="id"
        :name="field.key"
        :model-value="modelValue as number"
        :aria-describedby="describedBy(id, field, error)"
        :aria-invalid="error ? true : undefined"
        :disabled="disabled || loading"
        :validate-event="false"
        :data-testid="testId"
        @update:model-value="pick"
      >
        <ElRadioButton
          v-for="point in scale.points"
          :key="point"
          :value="point"
          :data-testid="optionTestId?.(String(point))"
          @blur="emit('blur')"
          @focus="emit('focus')"
        >
          {{ point }}
        </ElRadioButton>
      </ElRadioGroup>
      <div v-if="scale.start || scale.end" class="scale__anchors" aria-hidden="true">
        <span>{{ scale.start }}</span>
        <span>{{ scale.middle }}</span>
        <span>{{ scale.end }}</span>
      </div>
    </div>
  </FieldShell>
</template>

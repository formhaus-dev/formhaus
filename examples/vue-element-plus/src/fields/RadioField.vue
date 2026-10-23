<script setup lang="ts">
import { fieldComponentEmits, fieldComponentProps } from '@formhaus/vue';
import { ElRadio, ElRadioGroup } from 'element-plus';
import { computed } from 'vue';
import FieldShell from './FieldShell.vue';
import { describedBy } from './field';

const props = defineProps(fieldComponentProps);
const emit = defineEmits(fieldComponentEmits);
const id = computed(() => props.id ?? props.field.key);
const options = computed(() => props.matrix?.columns ?? props.field.options ?? []);
const tiles = computed(() => options.value.some((option) => option.image));

function pick(value: string | number | boolean | undefined) {
  if (props.field.autoAdvance) emit('commit', value);
  else emit('update:modelValue', value);
}
</script>

<template>
  <div v-if="matrix" class="matrix__row" data-fh="field">
    <span :id="`${id}-label`" class="matrix__label">{{ field.label }}</span>
    <ElRadioGroup
      :id="id"
      :name="field.key"
      :model-value="modelValue as string"
      :aria-labelledby="`${id}-label`"
      :aria-describedby="describedBy(id, field, error)"
      :aria-invalid="error ? true : undefined"
      :disabled="disabled || loading"
      :validate-event="false"
      class="matrix__cells"
      @update:model-value="pick"
    >
      <span v-for="option in options" :key="option.value" class="matrix__cell">
        <ElRadio :value="option.value" :aria-label="option.label" :data-testid="optionTestId?.(option.value)" @blur="emit('blur')" @focus="emit('focus')">
          <span class="sr-only">{{ option.label }}</span>
        </ElRadio>
      </span>
    </ElRadioGroup>
    <div v-if="error" :id="`${id}-error`" class="matrix__error el-form-item__error" role="alert">{{ error }}</div>
  </div>
  <FieldShell v-else :id="id" :field="field" :error="error" kind="group">
    <ElRadioGroup
      :id="id"
      :name="field.key"
      :model-value="modelValue as string"
      :aria-describedby="describedBy(id, field, error)"
      :aria-invalid="error ? true : undefined"
      :disabled="disabled || loading"
      :validate-event="false"
      :class="['choices', { 'choices--inline': field.layout === 'inline', 'choices--tiles': tiles }]"
      @update:model-value="pick"
    >
      <ElRadio
        v-for="option in options"
        :key="option.value"
        :value="option.value"
        :border="tiles"
        :data-testid="optionTestId?.(option.value)"
        @blur="emit('blur')"
        @focus="emit('focus')"
      >
        <img v-if="option.image" :src="option.image" alt="" class="choice__image" />
        {{ option.label }}
      </ElRadio>
    </ElRadioGroup>
  </FieldShell>
</template>

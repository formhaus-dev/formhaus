<script setup lang="ts">
import { fieldComponentEmits, fieldComponentProps } from '@formhaus/vue';
import Message from 'primevue/message';
import RadioButton from 'primevue/radiobutton';
import { computed } from 'vue';
import FieldShell from './FieldShell.vue';
import { describedBy } from './field';

const props = defineProps(fieldComponentProps);
const emit = defineEmits(fieldComponentEmits);
const id = computed(() => props.id ?? props.field.key);
const options = computed(() => props.matrix?.columns ?? props.field.options ?? []);
const tiles = computed(() => options.value.some((option) => option.image));
const optionId = (index: number) => (index === 0 ? id.value : `${id.value}-${index}`);

function pick(value: string) {
  if (props.field.autoAdvance) emit('commit', value);
  else emit('update:modelValue', value);
}
</script>

<template>
  <div
    v-if="matrix"
    class="matrix__row"
    data-fh="field"
    role="radiogroup"
    :aria-labelledby="`${id}-label`"
    :aria-describedby="describedBy(id, field, error)"
  >
    <span :id="`${id}-label`" class="matrix__label">{{ field.label }}</span>
    <span v-for="(option, index) in options" :key="option.value" class="matrix__cell">
      <RadioButton
        :input-id="optionId(index)"
        :name="field.key"
        :value="option.value"
        :model-value="modelValue"
        :aria-label="option.label"
        :invalid="!!error"
        :disabled="disabled || loading"
        :data-testid="optionTestId?.(option.value)"
        @update:model-value="pick"
        @blur="emit('blur')"
        @focus="emit('focus')"
      />
    </span>
    <Message v-if="error" :pt="{ root: { id: `${id}-error`, class: 'matrix__error' } }" size="small" severity="error" variant="simple">{{ error }}</Message>
  </div>
  <FieldShell v-else :id="id" :field="field" :error="error" kind="fieldset">
    <div :class="['choices', { 'choices--inline': field.layout === 'inline', 'choices--tiles': tiles }]">
      <label v-for="(option, index) in options" :key="option.value" :for="optionId(index)" class="choice">
        <img v-if="option.image" :src="option.image" alt="" class="choice__image" />
        <span class="choice__row">
          <RadioButton
            :input-id="optionId(index)"
            :name="field.key"
            :value="option.value"
            :model-value="modelValue"
            :invalid="!!error"
            :disabled="disabled || loading"
            :data-testid="optionTestId?.(option.value)"
            @update:model-value="pick"
            @blur="emit('blur')"
            @focus="emit('focus')"
          />
          {{ option.label }}
        </span>
      </label>
    </div>
  </FieldShell>
</template>

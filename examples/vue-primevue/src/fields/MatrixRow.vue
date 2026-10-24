<script setup lang="ts">
import { fieldComponentEmits, fieldComponentProps, useFieldProps } from '@formhaus/vue';
import Message from 'primevue/message';
import RadioButton from 'primevue/radiobutton';

const props = defineProps(fieldComponentProps);
const emit = defineEmits(fieldComponentEmits);
const f = useFieldProps(props, emit);
</script>

<template>
  <div class="matrix__row" data-fh="field" role="radiogroup" :aria-labelledby="`${f.id}-label`" :aria-describedby="f.describedBy">
    <div class="matrix__label">
      <span :id="`${f.id}-label`">{{ f.label }}</span>
      <Message v-if="f.helperText" :pt="{ root: { id: f.helperId, role: null, 'aria-live': null } }" size="small" severity="secondary" variant="simple">
        {{ f.helperText }}
      </Message>
    </div>
    <span v-for="(option, index) in f.options" :key="option.value" class="matrix__cell">
      <RadioButton
        :input-id="f.optionId(index)"
        :name="f.name"
        :value="option.value"
        :model-value="f.value"
        :aria-label="option.label"
        :invalid="f.invalid"
        :disabled="f.disabled"
        :data-testid="f.option(option, index)['data-testid']"
        @update:model-value="f.commit"
        @blur="f.blur"
        @focus="f.focus"
      />
    </span>
    <Message v-if="f.error" :pt="{ root: { id: f.errorId, class: 'matrix__error' } }" size="small" severity="error" variant="simple">{{ f.error }}</Message>
  </div>
</template>

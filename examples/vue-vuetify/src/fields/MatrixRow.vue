<script setup lang="ts">
import { fieldComponentEmits, fieldComponentProps, useFieldProps } from '@formhaus/vue';

const props = defineProps(fieldComponentProps);
const emit = defineEmits(fieldComponentEmits);
const f = useFieldProps(props, emit);
</script>

<template>
  <div class="matrix-row" data-fh="field">
    <div class="matrix-row__label text-body-2">
      <span :id="`${f.id}-label`">{{ f.label }}</span>
      <div v-if="f.helperText" :id="f.helperId" class="text-caption text-medium-emphasis">{{ f.helperText }}</div>
      <div v-if="f.error" :id="f.errorId" class="text-caption text-error">{{ f.error }}</div>
    </div>
    <v-radio-group
      :model-value="f.value ?? null"
      :aria-labelledby="`${f.id}-label`"
      :aria-describedby="f.describedBy"
      :disabled="f.disabled"
      :error="f.invalid"
      inline
      hide-details
      class="matrix-row__group"
      @update:model-value="f.commit"
    >
      <v-radio
        v-for="(option, index) in f.options"
        :key="option.value"
        :value="option.value"
        :aria-label="option.label"
        :data-testid="f.option(option, index)['data-testid']"
        class="matrix-row__cell"
        @blur="f.blur"
        @focus="f.focus"
      />
    </v-radio-group>
  </div>
</template>

<script setup lang="ts">
import { fieldComponentEmits, fieldComponentProps, useFieldProps } from '@formhaus/vue';

const props = defineProps(fieldComponentProps);
const emit = defineEmits(fieldComponentEmits);
const f = useFieldProps(props, emit);
</script>

<template>
  <div>
    <label :for="f.id">{{ f.label }}</label>
    <input v-bind="f.attrs" :type="f.inputType" :value="f.text" @input="f.onInput" />
    <p v-if="f.helperText" :id="f.helperId">{{ f.helperText }}</p>
    <p v-if="f.error" :id="f.errorId">{{ f.error }}</p>
  </div>
</template>

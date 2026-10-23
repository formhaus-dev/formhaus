<script setup lang="ts">
import { fieldComponentEmits, fieldComponentProps, useFieldProps } from '@formhaus/vue';

const props = defineProps(fieldComponentProps);
const emit = defineEmits(fieldComponentEmits);
const f = useFieldProps(props, emit);
</script>

<template>
  <fieldset data-fh="field" :data-row="props.matrix?.row" :class="{ matrix__row: props.matrix }" v-bind="f.aria">
    <legend>{{ f.label }}</legend>
    <label v-for="(option, index) in f.options" :key="option.value">
      <input type="radio" v-bind="f.option(option, index)" @change="f.change(option.value)" />
      <span :class="{ 'visually-hidden': props.matrix }">{{ option.label }}</span>
    </label>
    <p v-if="f.error" :id="f.errorId">{{ f.error }}</p>
  </fieldset>
</template>

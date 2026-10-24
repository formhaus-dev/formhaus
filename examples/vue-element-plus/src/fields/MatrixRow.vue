<script setup lang="ts">
import { fieldComponentEmits, fieldComponentProps, useFieldProps } from '@formhaus/vue';
import { ElRadio, ElRadioGroup, ElText } from 'element-plus';

const props = defineProps(fieldComponentProps);
const emit = defineEmits(fieldComponentEmits);
const f = useFieldProps(props, emit);
</script>

<template>
  <div class="matrix__row" data-fh="field">
    <div class="matrix__label">
      <span :id="`${f.id}-label`">{{ f.label }}</span>
      <ElText v-if="f.helperText" :id="f.helperId" tag="div" size="small" type="info">{{ f.helperText }}</ElText>
    </div>
    <ElRadioGroup
      :id="f.id"
      :name="f.name"
      :model-value="f.text"
      :aria-labelledby="`${f.id}-label`"
      :aria-describedby="f.describedBy"
      :aria-invalid="f.aria['aria-invalid']"
      :disabled="f.disabled"
      class="matrix__cells"
      @update:model-value="f.commit"
    >
      <span v-for="(option, index) in f.options" :key="option.value" class="matrix__cell">
        <ElRadio :value="option.value" :aria-label="option.label" :data-testid="f.option(option, index)['data-testid']" @blur="f.blur" @focus="f.focus">
          <span class="sr-only">{{ option.label }}</span>
        </ElRadio>
      </span>
    </ElRadioGroup>
    <div v-if="f.error" :id="f.errorId" class="matrix__error el-form-item__error" role="alert">{{ f.error }}</div>
  </div>
</template>

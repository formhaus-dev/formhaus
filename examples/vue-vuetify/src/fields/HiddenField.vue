<script setup>
defineProps({
  field: { type: Object, required: true },
  id: { type: String, default: undefined },
  modelValue: { default: undefined },
  error: { type: String, default: undefined },
  loading: { type: Boolean, default: false },
  disabled: { type: Boolean, default: false },
});

defineEmits(['update:modelValue', 'commit', 'blur', 'focus']);
</script>

<template>
  <input :id="id" type="hidden" :name="field.key" :value="modelValue != null ? String(modelValue) : ''" />
</template>

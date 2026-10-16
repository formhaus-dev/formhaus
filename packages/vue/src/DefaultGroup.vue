<script setup lang="ts">
import { groupComponentProps } from './props';

defineProps(groupComponentProps);
</script>

<template>
  <fieldset :id="id" class="fh-group" :aria-invalid="error ? true : undefined" :aria-describedby="describedBy">
    <legend class="fh-field__label">{{ label }}</legend>
    <p v-if="helperText" :id="`${id}-helper`" class="fh-field__helper fh-group__helper">{{ helperText }}</p>
    <p v-if="error" :id="`${id}-error`" class="fh-field__error fh-group__error" role="alert">{{ error }}</p>
    <div class="fh-group__body">
      <component :is="itemComponent" v-for="item in items" :key="item.id" v-bind="item" />
      <button v-if="canAdd" type="button" class="fh-form-actions__button fh-form-actions__button--secondary fh-group__add"
        :disabled="disabled" @click="add">{{ addLabel }}</button>
    </div>
    <p class="fh-group__status" role="status">{{ status }}</p>
  </fieldset>
</template>

<script setup lang="ts">
import { groupComponentProps } from '@formhaus/vue';
import { ElButton, ElCard, ElText } from 'element-plus';

defineProps(groupComponentProps);
</script>

<template>
  <ElCard
    :id="id"
    shadow="never"
    role="group"
    data-fh="group"
    :aria-labelledby="`${id}-title`"
    :aria-describedby="describedBy"
    :aria-invalid="error ? true : undefined"
    class="section"
  >
    <template #header>
      <h3 :id="`${id}-title`" class="section__title">{{ label }}</h3>
      <ElText v-if="helperText" :id="`${id}-helper`" tag="p" type="info" class="section__description">{{ helperText }}</ElText>
    </template>
    <div class="fields">
      <component :is="itemComponent" v-for="item in items" :key="item.id" v-bind="item" />
    </div>
    <ElText v-if="error" :id="`${id}-error`" tag="p" type="danger" role="alert" class="group__error">{{ error }}</ElText>
    <ElButton v-if="canAdd" :disabled="disabled" data-fh-group-add class="group__add" @click="add">{{ addLabel }}</ElButton>
    <p class="sr-only" role="status">{{ status }}</p>
  </ElCard>
</template>

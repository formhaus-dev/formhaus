<script setup lang="ts">
import { optionDescriptionId } from '@formhaus/core/fields';
import { optionDescriptionProps } from '../innerProps';

const props = defineProps(optionDescriptionProps);
</script>

<template>
  <span v-if="props.option.description" :id="optionDescriptionId(props.id)" class="fh-field__option-description">{{ props.option.description }}</span>
</template>

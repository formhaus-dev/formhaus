<script setup lang="ts">
import { groupComponentProps } from '@formhaus/vue';
import Button from 'primevue/button';
import Fieldset from 'primevue/fieldset';
import Message from 'primevue/message';

defineProps(groupComponentProps);
</script>

<template>
  <Fieldset :id="id" :legend="label" data-fh="group" :aria-describedby="describedBy" :aria-invalid="error ? true : undefined" class="section">
    <Message v-if="helperText" :pt="{ root: { id: `${id}-helper`, role: null, 'aria-live': null } }" size="small" severity="secondary" variant="simple">
      {{ helperText }}
    </Message>
    <div class="fields">
      <component :is="itemComponent" v-for="item in items" :key="item.id" v-bind="item" />
    </div>
    <Message v-if="error" :pt="{ root: { id: `${id}-error` } }" size="small" severity="error" variant="simple">{{ error }}</Message>
    <Button v-if="canAdd" :label="addLabel" severity="secondary" variant="outlined" :disabled="disabled" data-fh-group-add class="group__add" @click="add" />
    <p class="sr-only" role="status">{{ status }}</p>
  </Fieldset>
</template>

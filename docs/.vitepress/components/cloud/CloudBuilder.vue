<script setup lang="ts">
import type { FormDefinition } from '@formhaus/core';
import LandingDemo from '../landing/LandingDemo.vue';
import SectionCta from '../landing/SectionCta.vue';
import webinar from './webinar.json';
</script>

<template>
  <LandingDemo
    :seed="webinar as FormDefinition"
    title="Easy to build, easy to change"
    lead="Arrange fields, split long forms into steps, and add logic in a click."
    :json="false"
    :height="693"
  >
    <template #after><SectionCta href="/build" label="Open the builder" /></template>
  </LandingDemo>
</template>

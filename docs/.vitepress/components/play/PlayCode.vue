<script setup lang="ts">
import { computed, ref } from 'vue';
import LucideIcon from '../landing/LucideIcon.vue';
import type { Code } from './play-state';
import { roving } from './roving';

const props = defineProps<{ code?: Code; dir: string }>();
const index = ref(0);
const copied = ref(false);
const file = computed(() => props.code?.files[index.value]);
let timer: ReturnType<typeof setTimeout> | undefined;

async function copy() {
  if (!file.value) return;
  await navigator.clipboard.writeText(file.value.source);
  copied.value = true;
  clearTimeout(timer);
  timer = setTimeout(() => (copied.value = false), 1600);
}
</script>

<template>
  <div class="play-code">
    <div class="play-code__files" role="tablist" aria-label="Files" @keydown="roving">
      <button
        v-for="(entry, position) in code?.files ?? []"
        :key="entry.path"
        type="button"
        role="tab"
        :aria-selected="position === index"
        :tabindex="position === index ? 0 : -1"
        @click="index = position"
      >
        {{ entry.path.replace(/^src\//, '') }}
      </button>
    </div>
    <div class="play-code__body">
      <div class="play-code__meta">
        <span>examples/{{ code?.dir ?? dir }}/{{ file?.path }}</span>
        <button type="button" class="play-button play-button--small" :disabled="!file" @click="copy">
          <LucideIcon :name="copied ? 'check' : 'copy'" />{{ copied ? 'Copied' : 'Copy' }}
        </button>
      </div>
      <div v-if="file" class="play-code__src" v-html="file.html" />
      <p v-else class="play-loading play-loading--inline">Loading code</p>
    </div>
  </div>
</template>

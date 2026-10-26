<script setup lang="ts">
import MiniSearch from 'minisearch';
import { computed, nextTick, onBeforeUnmount, onMounted, ref, shallowRef, watch } from 'vue';
import type { SearchEntry } from './search-index';
import { searchIndexes } from './nav';
import './site-search.css';

const open = ref(false);
const query = ref('');
const active = ref(0);
const input = ref<HTMLInputElement>();
const engine = shallowRef<MiniSearch<SearchEntry>>();
const failed = ref(false);
const mac = ref(true);
let trigger: HTMLElement | null = null;

const results = computed(() => {
  if (!engine.value || !query.value.trim()) return [];
  return engine.value
    .search(query.value, { prefix: true, fuzzy: 0.2, boost: { title: 3, section: 2 } })
    .slice(0, 8) as unknown as SearchEntry[];
});

async function load() {
  if (engine.value) return;
  try {
    const lists = await Promise.all(
      searchIndexes.map((url) =>
        fetch(url).then(
          (response) => (response.ok ? (response.json() as Promise<SearchEntry[]>) : []),
          () => [],
        ),
      ),
    );
    const search = new MiniSearch<SearchEntry>({ fields: ['title', 'section', 'text'], storeFields: ['url', 'title', 'section', 'text'] });
    const seen = new Set<string>();
    search.addAll(lists.flat().filter((entry) => !seen.has(entry.id) && seen.add(entry.id)));
    engine.value = search;
  } catch {
    failed.value = true;
  }
}

async function show() {
  trigger = document.activeElement as HTMLElement | null;
  open.value = true;
  load();
  await nextTick();
  input.value?.focus();
}

function hide() {
  open.value = false;
  query.value = '';
  trigger?.focus();
}

function go(entry: SearchEntry | undefined) {
  if (!entry) return;
  hide();
  window.location.href = entry.url;
}

function editing(target: EventTarget | null) {
  const element = target as HTMLElement | null;
  return Boolean(element?.isContentEditable || ['INPUT', 'TEXTAREA', 'SELECT'].includes(element?.tagName ?? ''));
}

function hotkey(event: KeyboardEvent) {
  if ((event.key.toLowerCase() === 'k' && (event.metaKey || event.ctrlKey)) || (event.key === '/' && !editing(event.target))) {
    event.preventDefault();
    if (open.value) hide();
    else show();
  }
}

function keys(event: KeyboardEvent) {
  if (event.key === 'Escape') {
    event.preventDefault();
    hide();
  } else if (event.key === 'ArrowDown') {
    event.preventDefault();
    active.value = Math.min(active.value + 1, results.value.length - 1);
  } else if (event.key === 'ArrowUp') {
    event.preventDefault();
    active.value = Math.max(active.value - 1, 0);
  } else if (event.key === 'Enter') {
    event.preventDefault();
    go(results.value[active.value]);
  }
}

watch(query, () => {
  active.value = 0;
});

onMounted(() => {
  mac.value = /Mac|iPhone|iPad/.test(navigator.platform);
  window.addEventListener('keydown', hotkey);
});
onBeforeUnmount(() => window.removeEventListener('keydown', hotkey));
</script>

<template>
  <button type="button" class="fh-search" aria-label="Search docs" aria-haspopup="dialog" @click="show">
    <svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="11" cy="11" r="8" /><path d="m21 21-4.3-4.3" /></svg>
    <span class="fh-search__label">Search docs</span>
    <kbd class="fh-search__keys">{{ mac ? '⌘' : 'Ctrl' }} K</kbd>
  </button>
  <Teleport to="body">
    <div v-if="open" class="fh-search-dialog" role="dialog" aria-modal="true" aria-label="Search docs" @keydown="keys">
      <div class="fh-search-dialog__backdrop" @click="hide" />
      <div class="fh-search-dialog__panel">
        <label class="fh-search-dialog__field">
          <svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="11" cy="11" r="8" /><path d="m21 21-4.3-4.3" /></svg>
          <input
            ref="input"
            v-model="query"
            type="search"
            placeholder="Search docs, guides and recipes"
            aria-label="Search docs"
            aria-controls="fh-search-results"
            :aria-activedescendant="results.length ? `fh-search-${active}` : undefined"
            autocomplete="off"
            spellcheck="false"
          />
          <kbd>Esc</kbd>
        </label>
        <ul v-if="results.length" id="fh-search-results" class="fh-search-dialog__results" role="listbox">
          <li v-for="(entry, index) in results" :id="`fh-search-${index}`" :key="entry.id" role="option" :aria-selected="index === active">
            <a :href="entry.url" @mouseenter="active = index" @click.prevent="go(entry)">
              <span class="fh-search-dialog__title">{{ entry.title }}<template v-if="entry.section"><span class="fh-search-dialog__sep" aria-hidden="true">›</span><span class="fh-search-dialog__section">{{ entry.section }}</span></template></span>
              <span class="fh-search-dialog__text">{{ entry.text }}</span>
            </a>
          </li>
        </ul>
        <p v-else class="fh-search-dialog__empty" role="status">
          {{ failed ? 'Search is unavailable right now.' : !query.trim() ? 'Type to search the docs.' : engine ? `No results for “${query}”.` : 'Loading…' }}
        </p>
      </div>
    </div>
  </Teleport>
</template>

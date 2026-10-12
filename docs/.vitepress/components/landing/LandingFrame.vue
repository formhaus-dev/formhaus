<script setup lang="ts">
const props = defineProps<{ label?: string; fixed?: boolean }>();
</script>

<template>
  <div :class="['frame', { 'frame--split': $slots.aside, 'frame--fixed': props.fixed }]">
    <div class="frame__bar">
      <span v-if="props.label" class="frame__label">{{ props.label }}</span>
      <slot name="bar" />
    </div>
    <div v-if="$slots['aside-bar']" class="frame__bar frame__bar--aside"><slot name="aside-bar" /></div>
    <div class="frame__main"><slot /></div>
    <div v-if="$slots.aside" class="frame__aside"><slot name="aside" /></div>
  </div>
</template>

<style scoped>
.frame {
  display: grid;
  grid-template-rows: 52px minmax(0, 1fr);
  overflow: hidden;
  border: 1px solid var(--vp-c-divider);
  border-radius: 16px;
  background: var(--vp-c-bg);
}

.frame__bar {
  display: flex;
  align-items: center;
  gap: 12px;
  min-width: 0;
  padding: 0 16px;
  border-bottom: 1px solid var(--vp-c-divider);
  background: var(--vp-c-bg-soft);
  font-size: 13px;
  line-height: 20px;
}

.frame__label {
  font-weight: 600;
  white-space: nowrap;
  color: var(--vp-c-text-1);
}

.frame__main,
.frame__aside {
  display: flex;
  flex-direction: column;
  min-width: 0;
  min-height: 0;
}

@media (min-width: 768px) {
  .frame--fixed {
    height: 600px;
  }

  .frame--split {
    grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
    grid-template-areas: 'bar aside-bar' 'main aside';
  }

  .frame--split .frame__bar { grid-area: bar; border-right: 1px solid var(--vp-c-divider); }
  .frame--split .frame__bar--aside { grid-area: aside-bar; border-right: 0; }
  .frame--split .frame__main { grid-area: main; border-right: 1px solid var(--vp-c-divider); }
  .frame--split .frame__aside { grid-area: aside; }
}

@media (max-width: 767px) {
  .frame {
    grid-template-rows: none;
  }

  .frame__bar--aside {
    order: 2;
    border-top: 1px solid var(--vp-c-divider);
  }

  .frame__aside {
    order: 3;
  }

  .frame__bar {
    min-height: 52px;
    padding: 0 12px;
  }
}
</style>

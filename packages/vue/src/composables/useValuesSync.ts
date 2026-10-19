import { applySources, warnMissingComponents } from '@formhaus/core/internal';
import { onBeforeUnmount, onMounted, watch, watchEffect } from 'vue';
import type { UseFormEngineReturn } from './useFormEngine';
import type { FormRendererEmits, FormRendererProps } from '../types';

export function useValuesSync(form: UseFormEngineReturn, props: FormRendererProps, emit: FormRendererEmits) {
  let stopValues = () => {};
  let emitted: object;
  const watchValues = (engine: typeof form.engine) => {
    stopValues();
    applySources(engine, props.initialValues);
    const changed = () => {
      if (form.values.value !== emitted) emit('valuesChange', (emitted = form.values.value));
    };
    stopValues = engine.subscribeValues(changed);
    changed();
    engine.start();
  };
  onMounted(() => watchValues(form.engine));
  watch(() => form.engine, watchValues, { flush: 'sync' });
  const resolveSources = () => props.keepValues && applySources(form.engine, form.engine.values);
  watch(() => props.definition, resolveSources, { flush: 'post' });
  onBeforeUnmount(() => stopValues());

  let watchMissing: (() => void) | undefined;
  try {
    if (process.env.NODE_ENV !== 'production') {
      const warned = new Set<string>();
      watchMissing = () => watchEffect(() => warnMissingComponents(props.definition, props.components, warned, props.onWarning));
    }
  } catch {}
  watchMissing?.();
}

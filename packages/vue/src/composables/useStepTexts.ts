import type { LabelKey } from '@formhaus/core';
import { recalled } from '@formhaus/core/internal';
import { computed, type ComputedRef } from 'vue';
import type { UseFormEngineReturn } from './useFormEngine';

export function useStepTexts(
  form: UseFormEngineReturn,
  stepErrors: ComputedRef<Record<string, unknown[]>>,
  label: (key: LabelKey, params: Record<string, unknown>) => string,
) {
  const errorsLabel = (count = 0) => (count ? label('stepErrors', { count }) : undefined);
  const step = computed(() => {
    void form.values.value;
    return form.currentStep.value && recalled(form.engine, form.currentStep.value);
  });
  const stepStatuses = computed(() => {
    void form.values.value;
    return form.visibleSteps.value.map((item) => ({
      id: item.id,
      title: recalled(form.engine, item).title,
      errorCount: stepErrors.value[item.id]?.length ?? 0,
      errorsLabel: errorsLabel(stepErrors.value[item.id]?.length),
    }));
  });
  return { step, stepStatuses, errorsLabel };
}

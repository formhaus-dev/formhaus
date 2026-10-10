import { createCloudController, initialCloudState, type CloudSubmission } from '@formhaus/core/cloud';
import { onBeforeUnmount, onMounted, shallowRef, watch } from 'vue';

interface CloudFormOptions {
  id: () => string;
  apiBase: () => string | undefined;
  onSuccess: (submission: CloudSubmission) => void;
  onError: () => ((error: unknown) => void) | undefined;
}

export function useCloudForm(options: CloudFormOptions) {
  const state = shallowRef(initialCloudState);
  let controller: ReturnType<typeof createCloudController> | undefined;

  function boot() {
    controller?.dispose();
    state.value = initialCloudState;
    controller = createCloudController({ id: options.id(), apiBase: options.apiBase() }, {
      onChange: (next) => { state.value = next; },
      onSuccess: options.onSuccess,
      onError: (error) => options.onError()?.(error),
    });
    controller.start();
  }

  onMounted(boot);
  watch([options.id, options.apiBase], () => controller && boot());
  onBeforeUnmount(() => controller?.dispose());

  const submit = (values: Record<string, unknown>, skippedSteps?: string[]) => controller!.submit(values, skippedSteps);
  return { state, submit };
}

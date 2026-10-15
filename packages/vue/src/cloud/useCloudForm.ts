import type { CloudSubmission, DraftStore, PublishedForm } from '@formhaus/core/cloud';
import { cloudStateFor, createCloudController } from '@formhaus/core/internal';
import { onBeforeUnmount, onMounted, shallowRef, watch } from 'vue';

interface CloudFormOptions {
  id: () => string;
  apiBase: () => string | undefined;
  initialForm: () => PublishedForm | undefined;
  draftStore: () => DraftStore | undefined;
  extraBody: () => Record<string, unknown>;
  onSuccess: (submission: CloudSubmission) => void;
  onError: () => ((error: unknown) => void) | undefined;
}

export function useCloudForm(options: CloudFormOptions) {
  const state = shallowRef(cloudStateFor(options.initialForm()));
  let controller: ReturnType<typeof createCloudController> | undefined;

  function boot() {
    controller?.dispose();
    state.value = cloudStateFor(options.initialForm());
    controller = createCloudController(
      {
        id: options.id(),
        apiBase: options.apiBase(),
        initialForm: options.initialForm(),
        draftStore: options.draftStore(),
        extraBody: options.extraBody,
      },
      {
        onChange: (next) => {
          state.value = next;
        },
        onSuccess: options.onSuccess,
        onError: (error) => options.onError()?.(error),
      },
    );
    controller.start();
  }

  onMounted(boot);
  watch([options.id, options.apiBase], () => controller && boot());
  onBeforeUnmount(() => controller?.dispose());

  const submit = (values: Record<string, unknown>, skippedSteps?: string[]) => controller!.submit(values, skippedSteps);
  const retry = () => controller!.start();
  const again = () => controller!.again();
  const saveDraft = (values: Record<string, unknown>) => controller?.saveDraft(values);
  return { state, submit, retry, again, saveDraft };
}

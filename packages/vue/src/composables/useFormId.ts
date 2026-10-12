import * as vue from 'vue';

let counter = 0;

export function useFormId(): string {
  const useId = (vue as { useId?: () => string | undefined }).useId;
  return useId?.() ?? `fh${counter++}`;
}

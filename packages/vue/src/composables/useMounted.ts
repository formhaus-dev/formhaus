import { getCurrentInstance, inject, onMounted, ref, ssrContextKey, type Ref } from 'vue';

export const clientRender = (): boolean => !getCurrentInstance()!.vnode.el && !inject(ssrContextKey, null);

export function useMounted(): Ref<boolean> {
  const mounted = ref(!getCurrentInstance() || clientRender());
  if (!mounted.value)
    onMounted(() => {
      mounted.value = true;
    });
  return mounted;
}

import { onBeforeUnmount, onMounted, ref } from 'vue';

export function useNear(target: () => HTMLElement | null) {
  const near = ref(false);
  let observer: IntersectionObserver | undefined;
  let element: HTMLElement | null = null;
  const show = () => {
    near.value = true;
    observer?.disconnect();
    element?.removeEventListener('pointerenter', show);
    element?.removeEventListener('focusin', show);
  };
  onMounted(() => {
    element = target();
    if (!element || !('IntersectionObserver' in window)) return show();
    observer = new IntersectionObserver((entries) => entries.some((entry) => entry.isIntersecting) && show(), { rootMargin: '400px 0px' });
    observer.observe(element);
    element.addEventListener('pointerenter', show);
    element.addEventListener('focusin', show);
  });
  onBeforeUnmount(show);
  return near;
}

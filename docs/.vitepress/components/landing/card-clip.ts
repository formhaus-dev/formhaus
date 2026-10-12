import { onBeforeUnmount, onMounted, type Ref } from 'vue';

const blocks = [
  '[class*="Canvas_canvas"] > :not(section)',
  '[class*="Canvas_section"] > :not(ul)',
  '[class*="Sortable_list"] > li',
].join(', ');

export function useCardClip(pane: Ref<HTMLElement | null>) {
  let observer: ResizeObserver | undefined;
  let watched: Element | null = null;

  function watch(el: HTMLElement) {
    const content = el.firstElementChild;
    if (!observer || !content || content === watched) return;
    if (watched) observer.unobserve(watched);
    observer.observe(content);
    watched = content;
  }

  function fit() {
    const el = pane.value;
    if (!el) return;
    watch(el);
    if (el.scrollTop > 0) return;
    el.style.maxHeight = '';
    const room = el.clientHeight;
    const pad = parseFloat(getComputedStyle(el).paddingBottom);
    const top = el.getBoundingClientRect().top;
    const bottoms = [...el.querySelectorAll<HTMLElement>(blocks)].map((block) => block.getBoundingClientRect().bottom - top);
    if (!bottoms.length || Math.max(...bottoms) + pad <= room) return;
    const fits = bottoms.filter((bottom) => bottom + pad <= room);
    if (fits.length) el.style.maxHeight = `${Math.ceil(Math.max(...fits)) + 2}px`;
  }

  onMounted(() => {
    if ('ResizeObserver' in window) observer = new ResizeObserver(() => requestAnimationFrame(fit));
    window.addEventListener('resize', fit);
  });

  onBeforeUnmount(() => {
    observer?.disconnect();
    window.removeEventListener('resize', fit);
  });
  return fit;
}

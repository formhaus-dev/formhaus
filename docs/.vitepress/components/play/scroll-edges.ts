export function trackEdges(scroller: HTMLElement, target: HTMLElement, axis: 'x' | 'y', watched: HTMLElement = scroller) {
  const horizontal = axis === 'x';
  const update = () => {
    const offset = horizontal ? scroller.scrollLeft : scroller.scrollTop;
    const view = horizontal ? scroller.clientWidth : scroller.clientHeight;
    const total = horizontal ? scroller.scrollWidth : scroller.scrollHeight;
    target.toggleAttribute('data-more-start', offset > 1);
    target.toggleAttribute('data-more-end', offset + view < total - 1);
  };
  const resize = new ResizeObserver(update);
  const mutate = new MutationObserver(update);
  scroller.addEventListener('scroll', update, { passive: true });
  resize.observe(scroller);
  mutate.observe(watched, { childList: true, subtree: true });
  update();
  return () => {
    scroller.removeEventListener('scroll', update);
    resize.disconnect();
    mutate.disconnect();
  };
}

export const scrollRoot = (node: Element | null): HTMLElement | null => node?.closest<HTMLElement>('[data-scroll]') ?? null;

export const scrollTop = (root: HTMLElement | null): number => (root ? root.scrollTop : window.scrollY);

export function scrollToY(root: HTMLElement | null, top: number) {
  if (root) root.scrollTo(0, top);
  else window.scrollTo(0, top);
}

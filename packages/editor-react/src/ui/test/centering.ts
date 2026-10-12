export interface Offset {
  part: string;
  delta: number;
}

function visible(element: Element): boolean {
  const style = getComputedStyle(element);
  const box = element.getBoundingClientRect();
  return box.width > 1 && box.height > 1 && style.position !== 'absolute' && style.position !== 'fixed' && style.visibility !== 'hidden';
}

function partBox(node: ChildNode): DOMRect | null {
  if (node.nodeType === Node.TEXT_NODE) {
    if (!node.textContent?.trim()) return null;
    const range = document.createRange();
    range.selectNodeContents(node);
    return range.getBoundingClientRect();
  }
  return node instanceof Element && visible(node) ? node.getBoundingClientRect() : null;
}

export function verticalOffsets(container: Element): Offset[] {
  const box = container.getBoundingClientRect();
  const style = getComputedStyle(container);
  const top = box.top + Number.parseFloat(style.borderTopWidth);
  const bottom = box.bottom - Number.parseFloat(style.borderBottomWidth);
  const center = (top + bottom) / 2;
  return [...container.childNodes].flatMap((node) => {
    const rect = partBox(node);
    if (!rect) return [];
    const part =
      node instanceof Element
        ? node.tagName.toLowerCase() + (node.getAttribute('class') ? `.${node.getAttribute('class') ?? ''}` : '')
        : `"${node.textContent?.trim() ?? ''}"`;
    return [{ part, delta: Math.round(((rect.top + rect.bottom) / 2 - center) * 10) / 10 }];
  });
}

export const offCenter = (container: Element, tolerance = 1) =>
  verticalOffsets(container).filter((offset) => Math.abs(offset.delta) > tolerance);

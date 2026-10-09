import { icon, type UiIcon } from './icons';

export function element<K extends keyof HTMLElementTagNameMap>(tag: K, className = '', text?: string): HTMLElementTagNameMap[K] {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text !== undefined) node.textContent = text;
  return node;
}

export function iconButton(name: UiIcon, label: string, onClick: () => void, className = 'icon-btn'): HTMLButtonElement {
  const node = element('button', className);
  node.type = 'button';
  node.title = label;
  node.setAttribute('aria-label', label);
  node.appendChild(icon(name));
  node.onclick = (event) => {
    event.stopPropagation();
    onClick();
  };
  return node;
}

export function selectSegment(buttons: HTMLElement[], attribute: string, value: string): void {
  for (const button of buttons) {
    const active = button.dataset[attribute] === value;
    button.classList.toggle('active', active);
    button.setAttribute('aria-pressed', String(active));
  }
}

export function byId<T extends HTMLElement>(id: string): T {
  const node = document.getElementById(id);
  if (!node) throw new Error(`Missing UI element: ${id}`);
  return node as T;
}

export interface PreviewStore {
  url(bytes: Uint8Array): string;
  release(): void;
}

export function previewStore(): PreviewStore {
  const urls: string[] = [];
  return {
    url(bytes) {
      const url = URL.createObjectURL(new Blob([bytes as Uint8Array<ArrayBuffer>], { type: 'image/png' }));
      urls.push(url);
      return url;
    },
    release() {
      for (const url of urls.splice(0)) URL.revokeObjectURL(url);
    },
  };
}

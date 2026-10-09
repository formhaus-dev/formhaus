import { element } from '../dom';

export function textInput(value: string, placeholder: string, className: string, onInput: (value: string) => void, label = placeholder): HTMLInputElement {
  const node = element('input', className);
  node.value = value;
  node.placeholder = placeholder;
  node.setAttribute('aria-label', label);
  node.oninput = () => onInput(node.value);
  return node;
}

export function labelled(text: string, control: HTMLElement, className: string, captionClass = ''): HTMLElement {
  const node = element('label', className);
  node.append(element('span', captionClass, text), control);
  return node;
}

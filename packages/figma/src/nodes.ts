import { isGroup, isSection, type FormField, type FormNode } from '@formhaus/core';

export function flatFields(nodes: FormNode[] = []): FormField[] {
  return nodes.flatMap((node) => (isSection(node) ? node.fields : [node])) as FormField[];
}

export function deepFields(nodes: FormNode[] = []): FormField[] {
  return flatFields(nodes).flatMap((field) => (isGroup(field) ? [field, ...field.fields] : [field]));
}

export function nodeKeys(nodes: FormNode[] = []): string[] {
  return [...nodes.filter(isSection).map((section) => section.key), ...deepFields(nodes).map((field) => field.key)];
}

export function nodeName(node: FormNode): string {
  return isSection(node) ? node.title : (node.label ?? node.key);
}

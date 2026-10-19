import { isGroup, isSection, type FormField, type FormGroup, type FormNode } from '@formhaus/core';
import { solid, stack, text } from './kits/primitives';
import { matrixColumns, renderMatrix } from './render-matrix';
import type { FormRenderer } from './renderers/types';

export async function appendNodes(frame: FrameNode, nodes: FormNode[] = [], renderer: FormRenderer): Promise<void> {
  const { theme } = renderer;
  for (const node of nodes) {
    if (isSection(node)) {
      const section = stack('VERTICAL', `Section: ${node.title}`, { itemSpacing: theme.card.gap });
      append(frame, section);
      append(section, text(node.title, { font: theme.fonts.semibold, size: theme.bodySize + 2, color: theme.text }, 'Section title'));
      if (node.description)
        append(
          section,
          text(node.description, { font: theme.fonts.regular, size: theme.captionSize, color: theme.muted }, 'Section description'),
        );
      if (node.layout === 'matrix' && matrixColumns(node).length > 0)
        append(section, await renderMatrix(node, renderer, (parent, child) => appendNodes(parent, [child], renderer)));
      else await appendNodes(section, node.fields, renderer);
    } else if (isGroup(node)) {
      append(frame, await renderGroup(node, renderer));
    } else if (node.type !== 'hidden') {
      append(frame, await renderer.field(node as FormField));
    }
  }
}

export function itemTitle(group: FormGroup, index: number): string {
  return (group.itemLabel ?? '{label} {index}').replace(/\{index\}/g, String(index + 1)).replace(/\{label\}/g, group.label);
}

async function renderGroup(group: FormGroup, renderer: FormRenderer): Promise<FrameNode> {
  const { theme } = renderer;
  const root = stack('VERTICAL', `Group: ${group.label}`, { itemSpacing: theme.card.gap });
  append(
    root,
    text(group.label, theme.groupLabel ?? { font: theme.fonts.semibold, size: theme.bodySize, color: theme.text }, 'Group label'),
  );
  if (group.helperText)
    append(root, text(group.helperText, { font: theme.fonts.regular, size: theme.captionSize, color: theme.muted }, 'Group helper'));
  for (let index = 0; index < Math.max(1, group.defaultItems ?? 0); index++) {
    const padding = theme.card.gap;
    const item = stack('VERTICAL', itemTitle(group, index), {
      itemSpacing: theme.card.gap,
      paddingTop: padding,
      paddingBottom: padding,
      paddingLeft: padding,
      paddingRight: padding,
    });
    item.strokes = solid(theme.muted, 0.35);
    item.cornerRadius = theme.card.radius;
    append(root, item);
    append(item, text(itemTitle(group, index), { font: theme.fonts.semibold, size: theme.captionSize, color: theme.muted }, 'Item title'));
    for (const field of group.fields) if (field.type !== 'hidden') append(item, await renderer.field(field));
  }
  const add = await renderer.button(group.addLabel ?? 'Add', 'secondary');
  if (add) {
    add.name = 'Add item';
    root.appendChild(add);
  }
  return root;
}

export function append(frame: FrameNode, node: SceneNode | null): void {
  if (!node) return;
  frame.appendChild(node);
  if ('layoutSizingHorizontal' in node) node.layoutSizingHorizontal = 'FILL';
  if (node.type === 'TEXT') node.textAutoResize = 'HEIGHT';
}

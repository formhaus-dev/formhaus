import type { FieldOption, FormField, FormNode, FormSection } from '@formhaus/core';
import type { KitTheme } from './kits/kit';
import { stack, text } from './kits/primitives';
import { appendFill, captionStyle, hairline } from './renderers/choice';
import { type FormRenderer, labelText } from './renderers/types';
import { drawingForField, isOptionRole } from './roles';

const LABEL_MIN = 160;
const LABEL_SHARE = 1.5;
const CELL_MIN = 44;
const ROW_HEIGHT = 48;
const LABEL_GAP = 12;
const CELL_GAP = 4;
const HEADER_PADDING = 8;

type AppendOther = (frame: FrameNode, node: FormNode) => Promise<void>;

function bottomBorder(frame: FrameNode, theme: KitTheme): void {
  frame.strokes = hairline(theme);
  frame.strokeTopWeight = 0;
  frame.strokeLeftWeight = 0;
  frame.strokeRightWeight = 0;
  frame.strokeBottomWeight = 1;
}

function centered(name: string, direction: 'HORIZONTAL' | 'VERTICAL' = 'HORIZONTAL'): FrameNode {
  return stack(direction, name, { primaryAxisAlignItems: 'CENTER', counterAxisAlignItems: 'CENTER', itemSpacing: CELL_GAP });
}

function labelColumn(field: FormField, width: number | null, theme: KitTheme): FrameNode {
  const column = stack('VERTICAL', 'Label column', { itemSpacing: CELL_GAP });
  if (width !== null) {
    column.resize(width, ROW_HEIGHT);
    column.primaryAxisSizingMode = 'AUTO';
  }
  appendFill(column, text(labelText(field), { font: theme.fonts.medium, size: theme.bodySize, color: theme.text }, 'Label'));
  if (field.helperText) appendFill(column, text(field.helperText, captionStyle(theme), 'Helper'));
  return column;
}

function header(columns: FieldOption[], label: number, theme: KitTheme): FrameNode {
  const row = stack('HORIZONTAL', 'Header', {
    itemSpacing: LABEL_GAP,
    paddingTop: HEADER_PADDING,
    paddingBottom: HEADER_PADDING,
    counterAxisAlignItems: 'MAX',
  });
  const spacer = stack('VERTICAL', 'Label column');
  spacer.resize(label - LABEL_GAP, 1);
  row.appendChild(spacer);
  const cells = stack('HORIZONTAL', 'Cells', { itemSpacing: CELL_GAP });
  appendFill(row, cells);
  for (const option of columns) {
    const node = text(option.label, { ...captionStyle(theme), font: theme.fonts.medium }, option.value);
    appendFill(cells, node);
    node.textAlignHorizontal = 'CENTER';
  }
  bottomBorder(row, theme);
  return row;
}

function choiceRow(field: FormField, columns: FieldOption[], label: number | null, renderer: FormRenderer): FrameNode {
  const { theme } = renderer;
  const table = label !== null;
  const row = stack(table ? 'HORIZONTAL' : 'VERTICAL', field.key, {
    itemSpacing: table ? LABEL_GAP : CELL_GAP,
    counterAxisAlignItems: table ? 'CENTER' : 'MIN',
    paddingTop: table ? 0 : LABEL_GAP,
    paddingBottom: table ? 0 : LABEL_GAP,
  });
  row.minHeight = ROW_HEIGHT;
  const column = labelColumn(field, table ? label - LABEL_GAP : null, theme);
  if (table) row.appendChild(column);
  else appendFill(row, column);
  const cells = stack('HORIZONTAL', 'Cells', { itemSpacing: CELL_GAP });
  appendFill(row, cells);
  const kind = drawingForField(field) === 'option.checkbox' ? 'checkbox' : 'radio';
  for (const option of columns) {
    const cell = centered(option.value, table ? 'HORIZONTAL' : 'VERTICAL');
    cell.appendChild(renderer.glyph(kind));
    if (!table) {
      const caption = text(option.label, captionStyle(theme), 'Caption');
      appendFill(cell, caption);
      caption.textAlignHorizontal = 'CENTER';
    }
    appendFill(cells, cell);
  }
  return row;
}

export function matrixColumns(section: FormSection): FieldOption[] {
  return (section.fields[0] as FormField | undefined)?.options ?? [];
}

export async function renderMatrix(section: FormSection, renderer: FormRenderer, appendOther: AppendOther): Promise<FrameNode> {
  const { theme } = renderer;
  const columns = matrixColumns(section);
  const width = theme.card.width - 2 * theme.card.padding;
  const label = Math.max(LABEL_MIN, (width * LABEL_SHARE) / (LABEL_SHARE + columns.length));
  const table = columns.length > 0 && (width - label) / columns.length >= CELL_MIN;
  const root = stack('VERTICAL', 'Matrix');
  if (table) appendFill(root, header(columns, label, theme));
  const rows = section.fields.filter((node) => node.type !== 'hidden');
  for (const [index, node] of rows.entries()) {
    const drawing = node.type === 'group' ? null : drawingForField(node as FormField);
    if (!drawing || !isOptionRole(drawing)) {
      await appendOther(root, node);
      continue;
    }
    const row = choiceRow(node as FormField, columns, table ? label : null, renderer);
    appendFill(root, row);
    if (index < rows.length - 1) bottomBorder(row, theme);
  }
  return root;
}

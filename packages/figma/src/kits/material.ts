import type { KitFonts } from '../fonts';
import type { IconName } from '../icons';
import type { ButtonKind } from '../roles';
import type { Kit } from './kit';
import { buildRole, type KitParts } from './builders';
import { bindHelperVisibility, bindText, buttonShell, fill, fixed, fixedWidth, icon, solid, stack, text } from './primitives';

const VERSION = 2;
const WIDTH = 320;

const C = {
  primary: '#6750A4',
  onPrimary: '#FFFFFF',
  surface: '#FEF7FF',
  onSurface: '#1D1B20',
  onSurfaceVariant: '#49454F',
  outline: '#79747E',
};

function helperRow(root: ComponentNode, fonts: KitFonts, indent: number): void {
  const row = stack('HORIZONTAL', 'Supporting', { paddingLeft: indent });
  const helper = text('Supporting text', { font: fonts.regular, size: 12, color: C.onSurfaceVariant }, 'Helper');
  row.appendChild(helper);
  root.appendChild(row);
  bindText(root, helper, 'helper');
  bindHelperVisibility(root, row);
}

function inputContainer(fonts: KitFonts, trailing: IconName | undefined, multiline: boolean, filled: boolean) {
  return (root: ComponentNode) => {
    fixedWidth(root, WIDTH, 40);
    root.itemSpacing = 4;
    const container = stack('HORIZONTAL', 'Container', {
      paddingLeft: 16,
      paddingRight: trailing ? 12 : 16,
      paddingTop: multiline ? 16 : 0,
      itemSpacing: 12,
      counterAxisAlignItems: multiline ? 'MIN' : 'CENTER',
    });
    container.cornerRadius = 4;
    container.strokes = solid(C.outline);
    container.strokeWeight = 1;
    const column = stack('VERTICAL', 'Content');
    const labelStyle = filled
      ? { font: fonts.regular, size: 12, color: C.onSurfaceVariant }
      : { font: fonts.regular, size: 16, color: C.onSurfaceVariant };
    const label = text('Label', labelStyle, 'Label');
    const value = filled ? text('Value', { font: fonts.regular, size: 16, color: C.onSurface }, 'Value') : null;
    column.appendChild(label);
    if (value) column.appendChild(value);
    container.appendChild(column);
    if (trailing) container.appendChild(icon(trailing, C.onSurfaceVariant, 24));
    root.appendChild(container);
    bindText(root, label, 'label');
    if (value) bindText(root, value, 'value');
    fixed(container, WIDTH, multiline ? 112 : 56);
    container.primaryAxisSizingMode = 'FIXED';
    fill(container);
    fill(column);
    helperRow(root, fonts, 16);
  };
}

function checkboxGlyph(): FrameNode {
  const box = figma.createFrame();
  box.name = 'Checkbox';
  box.resize(18, 18);
  box.cornerRadius = 2;
  box.fills = [];
  box.strokes = solid(C.onSurfaceVariant);
  box.strokeWeight = 2;
  box.strokeAlign = 'INSIDE';
  return box;
}

function radioGlyph(): EllipseNode {
  const ring = figma.createEllipse();
  ring.name = 'Radio';
  ring.resize(20, 20);
  ring.fills = [];
  ring.strokes = solid(C.onSurfaceVariant);
  ring.strokeWeight = 2;
  ring.strokeAlign = 'INSIDE';
  return ring;
}

function switchGlyph(): FrameNode {
  const track = figma.createFrame();
  track.name = 'Switch';
  track.resize(52, 32);
  track.cornerRadius = 16;
  track.fills = solid('#E6E0E9');
  track.strokes = solid(C.outline);
  track.strokeWeight = 2;
  track.strokeAlign = 'INSIDE';
  const thumb = figma.createEllipse();
  thumb.name = 'Thumb';
  thumb.resize(16, 16);
  thumb.x = 8;
  thumb.y = 8;
  thumb.fills = solid(C.outline);
  track.appendChild(thumb);
  return track;
}

function control(fonts: KitFonts, glyph: () => SceneNode, trailing: boolean, withHelper: boolean) {
  return (root: ComponentNode) => {
    fixedWidth(root, WIDTH, 40);
    const row = stack('HORIZONTAL', 'Row', { itemSpacing: 12, counterAxisAlignItems: 'CENTER', paddingTop: 8, paddingBottom: 8 });
    const label = text('Label', { font: fonts.regular, size: 16, color: C.onSurface }, 'Label');
    if (!trailing) row.appendChild(glyph());
    row.appendChild(label);
    if (trailing) row.appendChild(glyph());
    root.appendChild(row);
    fill(row);
    fill(label);
    bindText(root, label, 'label');
    if (withHelper) helperRow(root, fonts, trailing ? 0 : 30);
  };
}

function button(fonts: KitFonts, kind: ButtonKind) {
  return (root: ComponentNode) => {
    root.paddingLeft = 24;
    root.paddingRight = 24;
    root.cornerRadius = 20;
    root.fills = kind === 'primary' ? solid(C.primary) : [];
    if (kind === 'secondary') {
      root.strokes = solid(C.outline);
      root.strokeWeight = 1;
    }
    const label = text('Button', { font: fonts.medium, size: 14, color: kind === 'primary' ? C.onPrimary : C.primary }, 'Label');
    buttonShell(root, label, WIDTH, 40);
  };
}

const PARTS: KitParts = {
  version: VERSION,
  selectIcon: 'arrowDropDown',
  input: inputContainer,
  controls: {
    'field.checkbox': (fonts) => control(fonts, checkboxGlyph, false, true),
    'field.switch': (fonts) => control(fonts, switchGlyph, true, true),
    'option.radio': (fonts) => control(fonts, radioGlyph, false, false),
    'option.checkbox': (fonts) => control(fonts, checkboxGlyph, false, false),
  },
  button,
};

export const materialKit: Kit = {
  id: 'material',
  name: 'Material 3',
  version: VERSION,
  fontFamilies: ['Roboto'],
  theme: (fonts) => ({
    fonts,
    text: C.onSurface,
    muted: C.onSurfaceVariant,
    card: { fill: C.surface, radius: 28, padding: 24, gap: 16, width: 400 },
    actionsGap: 8,
    optionGroup: { gap: 0 },
    titleSize: 24,
    bodySize: 16,
    captionSize: 12,
  }),
  build: (role, fonts) => buildRole(PARTS, role, fonts),
};

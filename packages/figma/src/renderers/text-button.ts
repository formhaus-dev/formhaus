import type { TextStyle } from '../kits/primitives';
import { stack, text } from '../kits/primitives';

export function textButton(label: string, style: TextStyle, size: { width: number; height: number }): FrameNode {
  const frame = stack('HORIZONTAL', label, { primaryAxisAlignItems: 'CENTER', counterAxisAlignItems: 'CENTER' });
  frame.appendChild(text(label, style, 'Label'));
  frame.resize(size.width, size.height);
  frame.primaryAxisSizingMode = 'FIXED';
  frame.counterAxisSizingMode = 'FIXED';
  return frame;
}

import { getButtonKey, getFormsConstructorKey } from '../constants';
import { createButtonInstance, createPlaceholder } from '../figma-helpers';
import type { KitTheme } from '../kits/kit';
import { renderField } from './legacy-field';
import type { FormRenderer } from './types';

const INTER = { regular: { family: 'Inter', style: 'Regular' }, medium: { family: 'Inter', style: 'Semi Bold' } };

export async function createLegacyRenderer(): Promise<FormRenderer> {
  const [fields, buttons] = await Promise.all([
    figma.importComponentSetByKeyAsync(getFormsConstructorKey()),
    figma.importComponentSetByKeyAsync(getButtonKey()),
    figma.loadFontAsync(INTER.regular),
    figma.loadFontAsync(INTER.medium),
  ]);
  const theme: KitTheme = {
    fonts: { regular: INTER.regular, medium: INTER.medium, semibold: INTER.medium },
    text: '#1A1A1A',
    muted: '#808080',
    card: { fill: '#FFFFFF', radius: 12, padding: 24, gap: 16, width: 400 },
    actionsGap: 8,
    optionGroup: { gap: 4 },
    titleSize: 24,
    bodySize: 14,
    captionSize: 12,
  };
  return {
    theme,
    async field(field) {
      return (await renderField(field, fields)) ?? createPlaceholder(field);
    },
    async button(label, primary) {
      return createButtonInstance(buttons, label, primary ? 'Primary' : 'Secondary');
    },
  };
}

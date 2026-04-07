import type { FormField } from '@formhaus/core';
import { getFields, getTextLayers, type FieldMapping } from './constants';
import { createPlaceholder, setNestedText } from './figma-helpers';

const LABEL_FONT_SIZE = 14;
const GROUP_SPACING = 4;
const ROW_SPACING = 8;

export async function renderField(
  field: FormField,
  fcSet: ComponentSetNode,
): Promise<SceneNode | null> {
  const fields = getFields();
  const mapping = fields[field.type];
  if (!mapping) return createPlaceholder(field);
  if (mapping.missing) return createPlaceholder(field);

  if (mapping.formsConstructorVariant) {
    return renderFormsConstructorField(field, mapping.formsConstructorVariant, fcSet);
  }
  if (mapping.standalone && mapping.standaloneKey) {
    return renderStandaloneField(field, mapping);
  }
  return createPlaceholder(field);
}

async function renderFormsConstructorField(
  field: FormField,
  variant: string,
  fcSet: ComponentSetNode,
): Promise<SceneNode> {
  const textLayers = getTextLayers();
  const hasHeader = !!field.label;
  const hasHelper = !!field.helperText;
  const variantName = `Type=${variant}, Header=${hasHeader ? 'True' : 'False'}, Helper_text=${hasHelper ? 'True' : 'False'}`;

  const comp = fcSet.children.find((c) => c.name === variantName) as ComponentNode | undefined;
  if (!comp) return createPlaceholder(field);

  const instance = comp.createInstance();
  instance.name = field.key;

  if (field.label) {
    const isRequired = field.validation?.required;
    const labelText = isRequired ? `${field.label} *` : field.label;
    await setNestedText(instance, textLayers.label, labelText, 'Semi Bold');
  }

  await setNestedText(instance, textLayers.placeholder, field.placeholder || ' ');

  if (field.helperText) {
    await setNestedText(instance, textLayers.helperText, field.helperText);
  }

  return instance;
}

async function renderStandaloneField(field: FormField, mapping: FieldMapping): Promise<SceneNode> {
  if (!mapping.standaloneKey) return createPlaceholder(field);

  let componentSet: ComponentSetNode;
  try {
    componentSet = await figma.importComponentSetByKeyAsync(mapping.standaloneKey);
  } catch (_e) {
    return createPlaceholder(field);
  }

  const variantName = Object.entries(mapping.variantProps || {})
    .map(([k, v]) => `${k}=${v}`)
    .join(', ');
  const comp = componentSet.children.find((c) => c.name === variantName) as
    | ComponentNode
    | undefined;
  if (!comp) return createPlaceholder(field);

  const isRequired = field.validation?.required;

  if (
    field.options &&
    field.options.length > 0 &&
    (field.type === 'radio' || field.type === 'checkbox')
  ) {
    return renderOptionGroup(field, comp, isRequired);
  }

  return renderSingleStandalone(field, comp, isRequired);
}

function renderOptionGroup(
  field: FormField,
  comp: ComponentNode,
  isRequired: boolean | string | undefined,
): FrameNode {
  const group = figma.createFrame();
  group.name = field.key;
  group.layoutMode = 'VERTICAL';
  group.primaryAxisSizingMode = 'AUTO';
  group.counterAxisSizingMode = 'AUTO';
  group.itemSpacing = GROUP_SPACING;
  group.fills = [];

  const groupLabel = figma.createText();
  groupLabel.fontName = { family: 'Inter', style: 'Semi Bold' };
  groupLabel.fontSize = LABEL_FONT_SIZE;
  groupLabel.characters = isRequired ? `${field.label} *` : field.label;
  group.appendChild(groupLabel);
  groupLabel.layoutSizingHorizontal = 'FILL';

  for (const option of field.options || []) {
    const row = figma.createFrame();
    row.name = option.value;
    row.layoutMode = 'HORIZONTAL';
    row.primaryAxisSizingMode = 'AUTO';
    row.counterAxisSizingMode = 'AUTO';
    row.itemSpacing = ROW_SPACING;
    row.counterAxisAlignItems = 'CENTER';
    row.fills = [];

    const instance = comp.createInstance();
    row.appendChild(instance);

    const optLabel = figma.createText();
    optLabel.fontName = { family: 'Inter', style: 'Regular' };
    optLabel.fontSize = LABEL_FONT_SIZE;
    optLabel.characters = option.label;
    row.appendChild(optLabel);

    group.appendChild(row);
  }

  return group;
}

function renderSingleStandalone(
  field: FormField,
  comp: ComponentNode,
  isRequired: boolean | string | undefined,
): FrameNode {
  const wrapper = figma.createFrame();
  wrapper.name = field.key;
  wrapper.layoutMode = 'HORIZONTAL';
  wrapper.primaryAxisSizingMode = 'AUTO';
  wrapper.counterAxisSizingMode = 'AUTO';
  wrapper.itemSpacing = ROW_SPACING;
  wrapper.counterAxisAlignItems = 'CENTER';
  wrapper.fills = [];

  const instance = comp.createInstance();
  wrapper.appendChild(instance);

  const labelNode = figma.createText();
  labelNode.fontName = { family: 'Inter', style: 'Regular' };
  labelNode.fontSize = LABEL_FONT_SIZE;
  labelNode.characters = isRequired ? `${field.label} *` : field.label;
  wrapper.appendChild(labelNode);

  return wrapper;
}

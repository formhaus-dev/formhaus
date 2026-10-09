import defaultComponentMap from './component-map.example.json';

export interface FieldMapping {
  formsConstructorVariant?: string;
  standalone?: boolean;
  standaloneKey?: string;
  variantProps?: Record<string, string>;
  missing?: boolean;
}

export interface ComponentMap {
  formsConstructorKey: string;
  formHelperTextKey?: string;
  buttonKey: string;
  fields: Record<string, FieldMapping>;
  textLayerNames: {
    label: string;
    placeholder: string;
    helperText: string;
  };
}

let activeComponentMap: ComponentMap = defaultComponentMap as ComponentMap;

export function setComponentMap(map: ComponentMap): void {
  activeComponentMap = map;
}

export function getComponentMap(): ComponentMap {
  return activeComponentMap;
}

export function resetComponentMap(): void {
  activeComponentMap = defaultComponentMap as ComponentMap;
}

export function getFormsConstructorKey(): string {
  return activeComponentMap.formsConstructorKey;
}

export function getButtonKey(): string {
  return activeComponentMap.buttonKey;
}

export function getTextLayers(): ComponentMap['textLayerNames'] {
  return activeComponentMap.textLayerNames;
}

export function getFields(): Record<string, FieldMapping> {
  return activeComponentMap.fields;
}

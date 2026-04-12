import AppTsx from '../../../../../examples/react-mui/src/App.tsx?raw';
import componentMapTs from '../../../../../examples/react-mui/src/component-map.ts?raw';
import mainTsx from '../../../../../examples/react-mui/src/main.tsx?raw';
import TextFieldTsx from '../../../../../examples/react-mui/src/fields/TextField.tsx?raw';
import SelectFieldTsx from '../../../../../examples/react-mui/src/fields/SelectField.tsx?raw';
import CheckboxFieldTsx from '../../../../../examples/react-mui/src/fields/CheckboxField.tsx?raw';
import RadioFieldTsx from '../../../../../examples/react-mui/src/fields/RadioField.tsx?raw';
import SwitchFieldTsx from '../../../../../examples/react-mui/src/fields/SwitchField.tsx?raw';
import FileFieldTsx from '../../../../../examples/react-mui/src/fields/FileField.tsx?raw';
import TextareaFieldTsx from '../../../../../examples/react-mui/src/fields/TextareaField.tsx?raw';
import FormActionsTsx from '../../../../../examples/react-mui/src/actions/FormActions.tsx?raw';
import StepProgressTsx from '../../../../../examples/react-mui/src/actions/StepProgress.tsx?raw';

export function buildFiles(definitionJson: string) {
  return {
    '/App.tsx': AppTsx,
    '/component-map.ts': componentMapTs,
    '/main.tsx': mainTsx,
    '/fields/TextField.tsx': TextFieldTsx,
    '/fields/SelectField.tsx': SelectFieldTsx,
    '/fields/CheckboxField.tsx': CheckboxFieldTsx,
    '/fields/RadioField.tsx': RadioFieldTsx,
    '/fields/SwitchField.tsx': SwitchFieldTsx,
    '/fields/FileField.tsx': FileFieldTsx,
    '/fields/TextareaField.tsx': TextareaFieldTsx,
    '/actions/FormActions.tsx': FormActionsTsx,
    '/actions/StepProgress.tsx': StepProgressTsx,
    '/definition.json': definitionJson,
  };
}

export const template = 'react-ts' as const;
export const entry: string | undefined = undefined;
export const activeFile = '/App.tsx';
export const visibleFiles = ['/App.tsx', '/component-map.ts'];
export const editorHeight = 480;
export const deps: Record<string, string> = {
  '@formhaus/core': '0.3.1',
  '@formhaus/react': '0.3.1',
  '@mui/material': '6.4.0',
  '@emotion/react': '11.14.0',
  '@emotion/styled': '11.14.0',
  'react': '18.3.1',
  'react-dom': '18.3.1',
};

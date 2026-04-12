import AppVue from '../../../../../examples/vue-vuetify/src/App.vue?raw';
import componentMapTs from '../../../../../examples/vue-vuetify/src/component-map.ts?raw';
import mainTs from '../../../../../examples/vue-vuetify/src/main.ts?raw';
import TextFieldVue from '../../../../../examples/vue-vuetify/src/fields/TextField.vue?raw';
import SelectFieldVue from '../../../../../examples/vue-vuetify/src/fields/SelectField.vue?raw';
import CheckboxFieldVue from '../../../../../examples/vue-vuetify/src/fields/CheckboxField.vue?raw';
import RadioFieldVue from '../../../../../examples/vue-vuetify/src/fields/RadioField.vue?raw';
import SwitchFieldVue from '../../../../../examples/vue-vuetify/src/fields/SwitchField.vue?raw';
import FileFieldVue from '../../../../../examples/vue-vuetify/src/fields/FileField.vue?raw';
import TextareaFieldVue from '../../../../../examples/vue-vuetify/src/fields/TextareaField.vue?raw';
import FormActionsVue from '../../../../../examples/vue-vuetify/src/actions/FormActions.vue?raw';
import StepProgressVue from '../../../../../examples/vue-vuetify/src/actions/StepProgress.vue?raw';

export function buildFiles(definitionJson: string) {
  return {
    'src/App.vue': AppVue,
    'src/component-map.ts': componentMapTs,
    'src/main.ts': mainTs,
    'src/fields/TextField.vue': TextFieldVue,
    'src/fields/SelectField.vue': SelectFieldVue,
    'src/fields/CheckboxField.vue': CheckboxFieldVue,
    'src/fields/RadioField.vue': RadioFieldVue,
    'src/fields/SwitchField.vue': SwitchFieldVue,
    'src/fields/FileField.vue': FileFieldVue,
    'src/fields/TextareaField.vue': TextareaFieldVue,
    'src/actions/FormActions.vue': FormActionsVue,
    'src/actions/StepProgress.vue': StepProgressVue,
    'src/definition.json': definitionJson,
  };
}

export const template = 'vue3-ts' as const;
export const activeFile = 'src/App.vue';
export const visibleFiles = ['src/App.vue', 'src/component-map.ts'];
export const editorHeight = 480;
export const entry = '/src/main.ts';
export const deps: Record<string, string> = {
  '@formhaus/core': '0.3.1',
  '@formhaus/vue': '0.3.1',
  'vuetify': '3.7.0',
  '@mdi/font': '7.4.47',
};

import type { FormRendererHandle } from '@formhaus/core';
import type { Ref } from 'vue';
import FormRendererComponent from './FormRenderer.vue';
import HeadlessFormRendererComponent from './HeadlessFormRenderer.vue';
import FormhausFieldComponent from './FormhausField.vue';
import FormActionsComponent from './FormActions.vue';
import DefaultConfirmDialogComponent from './DefaultConfirmDialog.vue';
import DefaultGroupComponent from './DefaultGroup.vue';
import DefaultGroupItemComponent from './DefaultGroupItem.vue';
import DefaultSectionComponent from './DefaultSection.vue';
import FormStepProgressComponent from './FormStepProgress.vue';
import TextFieldComponent from './fields/TextField.vue';
import TextareaFieldComponent from './fields/TextareaField.vue';
import SelectFieldComponent from './fields/SelectField.vue';
import CheckboxFieldComponent from './fields/CheckboxField.vue';
import RadioFieldComponent from './fields/RadioField.vue';
import ScaleFieldComponent from './fields/ScaleField.vue';
import SwitchFieldComponent from './fields/SwitchField.vue';
import FileFieldComponent from './fields/FileField.vue';
import DateFieldComponent from './fields/DateField.vue';
import DateTimeFieldComponent from './fields/DateTimeField.vue';
import TimeFieldComponent from './fields/TimeField.vue';
import HiddenFieldComponent from './fields/HiddenField.vue';
import AutocompleteFieldComponent from './fields/AutocompleteField.vue';
import MultiselectFieldComponent from './fields/MultiselectField.vue';
import type {
  confirmDialogComponentProps,
  fieldComponentEmits,
  fieldComponentProps,
  formActionsEmits,
  formActionsProps,
  formStepProgressProps,
  groupComponentProps,
  groupItemComponentProps,
  sectionComponentProps,
} from './props';
import type { EmitsOf, FieldResolverProps, FormRendererEvents, FormRendererProps, TypedComponent, WithSlots } from './types';

type RendererComponent = TypedComponent<
  FormRendererProps,
  EmitsOf<FormRendererEvents>,
  Omit<FormRendererHandle, 'values'> & { values: Readonly<Ref<FormRendererHandle['values']>> }
>;

type FieldComponentEmits = EmitsOf<typeof fieldComponentEmits>;
type CommitFieldComponent = TypedComponent<typeof fieldComponentProps, FieldComponentEmits>;
type FieldComponent = TypedComponent<typeof fieldComponentProps, Omit<FieldComponentEmits, 'commit'>>;

export const FormRenderer: RendererComponent = FormRendererComponent;
export const HeadlessFormRenderer: RendererComponent = HeadlessFormRendererComponent;
export const FormhausField: TypedComponent<FieldResolverProps, FieldComponentEmits> = FormhausFieldComponent;
export const FormActions: TypedComponent<typeof formActionsProps, EmitsOf<typeof formActionsEmits>> = FormActionsComponent;
export const DefaultConfirmDialog: TypedComponent<typeof confirmDialogComponentProps> = DefaultConfirmDialogComponent;
export const DefaultGroup: TypedComponent<typeof groupComponentProps> = DefaultGroupComponent;
export const DefaultGroupItem: TypedComponent<typeof groupItemComponentProps> = DefaultGroupItemComponent;
export const DefaultSection: WithSlots<TypedComponent<typeof sectionComponentProps>, { default(): unknown }> = DefaultSectionComponent;
export const FormStepProgress: TypedComponent<typeof formStepProgressProps> = FormStepProgressComponent;
export const TextField: FieldComponent = TextFieldComponent;
export const TextareaField: FieldComponent = TextareaFieldComponent;
export const SelectField: FieldComponent = SelectFieldComponent;
export const CheckboxField: FieldComponent = CheckboxFieldComponent;
export const RadioField: CommitFieldComponent = RadioFieldComponent;
export const ScaleField: CommitFieldComponent = ScaleFieldComponent;
export const SwitchField: FieldComponent = SwitchFieldComponent;
export const FileField: FieldComponent = FileFieldComponent;
export const DateField: FieldComponent = DateFieldComponent;
export const DateTimeField: FieldComponent = DateTimeFieldComponent;
export const TimeField: FieldComponent = TimeFieldComponent;
export const HiddenField: CommitFieldComponent = HiddenFieldComponent;
export const AutocompleteField: FieldComponent = AutocompleteFieldComponent;
export const MultiselectField: FieldComponent = MultiselectFieldComponent;

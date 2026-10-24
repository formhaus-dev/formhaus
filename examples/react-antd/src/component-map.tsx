import { toDate } from '@formhaus/core/fields';
import type { FieldComponentMap, FieldComponentProps, FieldProps, LayoutComponentMap } from '@formhaus/react';
import { type ControlOption, mapControls } from '@formhaus/react/controls';
import {
  AutoComplete,
  Button,
  Checkbox,
  DatePicker,
  Input,
  InputNumber,
  Radio,
  Rate,
  Select,
  Switch,
  TimePicker,
  Upload,
  type UploadProps,
} from 'antd';
import dayjs from 'dayjs';
import { MatrixRow } from './fields/MatrixRow';
import { Shell } from './fields/Shell';
import { ConfirmDialog, FormActions, Group, GroupItem, Section } from './layout/Containers';
import { ErrorSummary, FormErrors, StepProgress } from './layout/Feedback';

const picked = (f: FieldProps) => {
  const date = toDate(f.value);
  return { value: date && dayjs(date), style: { width: '100%' } };
};

const upload = (f: FieldProps): UploadProps => ({
  id: undefined,
  maxCount: 1,
  fileList: f.value instanceof File ? [{ uid: f.value.name, name: f.value.name, status: 'done' }] : [],
  beforeUpload: () => false,
  onChange: ({ file }) => f.change(file.status === 'removed' ? null : (file.originFileObj ?? file)),
  children: <Button {...f.attrs}>Choose file</Button>,
});

const choose = (f: FieldProps, options: ControlOption[]) => ({ options, allowClear: !f.required, placeholder: f.placeholder ?? 'Select' });

const single = (f: FieldProps, options: ControlOption[]) => ({ ...choose(f, options), value: f.text || undefined });

const radios = (options: ControlOption[], inline: boolean) => {
  const tiles = options.some((option) => option.image);
  return {
    vertical: !tiles && !inline,
    className: tiles ? 'image-options' : undefined,
    options: options.map(({ value, label, image }) => ({
      value,
      className: image ? 'image-option' : undefined,
      label: image ? (
        <>
          <img src={image} alt="" className="image-option__image" />
          <span>{label}</span>
        </>
      ) : (
        label
      ),
    })),
  };
};

const base = { shell: Shell, matrix: MatrixRow };

const radio = (inline: boolean) =>
  mapControls({ ...base, controls: { radio: [Radio.Group, (_, options) => radios(options, inline)] } }).radio;

const InlineRadio = radio(true);
const StackedRadio = radio(false);

export const components: FieldComponentMap = {
  ...mapControls({
    ...base,
    freeText: true,
    kinds: { multiselect: 'input' },
    controls: {
      input: Input,
      password: Input.Password,
      number: [InputNumber, () => ({ style: { width: '100%' } })],
      textarea: Input.TextArea,
      select: [Select, single],
      multiselect: [Select, (f, options) => ({ ...choose(f, options), mode: 'multiple' })],
      autocomplete: [
        AutoComplete,
        (f, options) => ({
          options: options.map((option) => ({ value: option.label })),
          allowClear: true,
          filterOption: true,
          placeholder: f.placeholder,
        }),
      ],
      date: [DatePicker, picked],
      datetime: [DatePicker, (f) => ({ ...picked(f), showTime: { format: 'HH:mm' }, format: 'YYYY-MM-DD HH:mm' })],
      time: [TimePicker, (f) => ({ ...picked(f), format: 'HH:mm' })],
      checkbox: Checkbox,
      switch: Switch,
      scale: [Radio.Group, (_, options) => ({ options, optionType: 'button', buttonStyle: 'solid', block: true })],
      rating: [Rate, (_, options) => ({ 'aria-required': undefined, count: options.length })],
      file: [Upload, upload],
    },
  }),
  radio: (props: FieldComponentProps) => (props.field.layout === 'inline' ? <InlineRadio {...props} /> : <StackedRadio {...props} />),
};

export const layout: LayoutComponentMap = {
  actions: FormActions,
  progress: StepProgress,
  errorSummary: ErrorSummary,
  formErrors: FormErrors,
  section: Section,
  group: Group,
  groupItem: GroupItem,
  confirmDialog: ConfirmDialog,
};

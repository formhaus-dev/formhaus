import { toDate } from '@formhaus/core/fields';
import type { FieldComponentMap, FieldProps, LayoutComponentMap } from '@formhaus/react';
import { type ControlOption, mapControls } from '@formhaus/react/controls';
import { Button, Checkbox, DatePicker, Input, InputNumber, Radio, Rate, Select, Switch, TimePicker, Upload, type UploadProps } from 'antd';
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

const radios = (options: ControlOption[]) => {
  const tiles = options.some((option) => option.image);
  return {
    vertical: !tiles,
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

export const components: FieldComponentMap = {
  ...mapControls({
    shell: Shell,
    kinds: { multiselect: 'input' },
    matrix: MatrixRow,
    controls: {
      input: Input,
      password: Input.Password,
      number: [InputNumber, () => ({ style: { width: '100%' } })],
      textarea: Input.TextArea,
      select: [Select, single],
      multiselect: [Select, (f, options) => ({ ...choose(f, options), mode: 'multiple' })],
      autocomplete: [Select, (f, options) => ({ ...single(f, options), showSearch: { optionFilterProp: 'label' } })],
      date: [DatePicker, picked],
      datetime: [DatePicker, (f) => ({ ...picked(f), showTime: { format: 'HH:mm' }, format: 'YYYY-MM-DD HH:mm' })],
      time: [TimePicker, (f) => ({ ...picked(f), format: 'HH:mm' })],
      checkbox: Checkbox,
      switch: Switch,
      radio: [Radio.Group, (_, options) => radios(options)],
      scale: [Radio.Group, (_, options) => ({ options, optionType: 'button', buttonStyle: 'solid', block: true })],
      rating: [Rate, (_, options) => ({ count: options.length })],
      file: [Upload, upload],
    },
  }),
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

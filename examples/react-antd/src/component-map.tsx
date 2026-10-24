import { toDate } from '@formhaus/core/fields';
import type { FieldComponentMap, FieldProps, LayoutComponentMap } from '@formhaus/react';
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
import { Choices } from './fields/Choices';
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

const counter = (f: FieldProps) => (f.maxLength ? { count: { show: true, max: f.maxLength } } : {});

const choose = (f: FieldProps, options: ControlOption[]) => ({ options, allowClear: !f.required, placeholder: f.placeholder ?? 'Select' });

const single = (f: FieldProps, options: ControlOption[]) => ({ ...choose(f, options), value: f.text || undefined });

export const components: FieldComponentMap = {
  ...mapControls({
    shell: Shell,
    matrix: MatrixRow,
    freeText: true,
    conditionalReveal: ['radio'],
    kinds: { multiselect: 'input' },
    controls: {
      input: { component: Input, props: counter },
      password: { component: Input.Password, props: counter },
      number: { component: InputNumber, props: () => ({ style: { width: '100%' } }) },
      textarea: { component: Input.TextArea, props: (f) => ({ ...counter(f), autoSize: { minRows: 3 } }) },
      select: { component: Select, props: single },
      multiselect: { component: Select, props: (f, options) => ({ ...choose(f, options), mode: 'multiple' }) },
      autocomplete: {
        component: AutoComplete,
        props: (f, options) => ({
          options: options.map((option) => ({ value: option.label })),
          allowClear: true,
          filterOption: true,
          placeholder: f.placeholder,
        }),
      },
      date: { component: DatePicker, props: picked },
      datetime: {
        component: DatePicker,
        props: (f) => ({ ...picked(f), showTime: { format: 'HH:mm' }, format: 'YYYY-MM-DD HH:mm' }),
      },
      time: { component: TimePicker, props: (f) => ({ ...picked(f), format: 'HH:mm' }) },
      checkbox: Checkbox,
      switch: Switch,
      radio: { component: Choices, optionsProp: 'options' },
      scale: {
        component: Radio.Group,
        optionsProp: 'options',
        props: () => ({ optionType: 'button', buttonStyle: 'solid', block: true }),
      },
      rating: { component: Rate, props: (_, options) => ({ 'aria-required': undefined, count: options.length }) },
      file: { component: Upload, props: upload },
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

import {
  canAutoAdvance,
  childrenOf,
  findField,
  hasOptions,
  isMatrix,
  isScale,
  setFieldProp,
  setMatrix,
  setMultiple,
  type BuilderQuestion,
} from '@formhaus/builder';
import { takesPlaceholder } from '../canvas/placeholder';
import { Field, Input } from '../ui';
import { useForm } from '../store/hooks';
import type { EditorActions } from '../useEditorActions';
import { FieldText } from './FieldText';
import { GroupSettings } from './GroupSettings';
import { LimitSettings } from './LimitSettings';
import { limitSpec } from './limits';
import { PerRow } from './PerRow';
import { RandomizeSetting } from './RandomizeSetting';
import { ScaleSettings } from './ScaleSettings';
import { SegmentedSetting } from './SegmentedSetting';
import { SettingsSection } from './SettingsSection';
import { SettingSwitch } from './SettingSwitch';

interface Props {
  field: BuilderQuestion;
  actions: EditorActions;
  readOnly: boolean;
}

const titleOf = (field: BuilderQuestion) => (hasOptions(field.type) ? 'Options' : field.type === 'section' ? 'Layout' : 'Answer');

function OptionLayout({ field, actions }: Omit<Props, 'readOnly'>) {
  return (
    <SegmentedSetting
      label="Option layout"
      options={[
        { value: 'stack', label: 'Stacked' },
        { value: 'inline', label: 'In a row' },
      ]}
      value={field.extra.layout ?? 'stack'}
      onValueChange={(value) => {
        actions.edit((form) => {
          setFieldProp(form, field.uid, 'layout', value === 'inline' ? 'inline' : undefined);
        });
      }}
    />
  );
}

function Rows({ field, actions, readOnly }: Props) {
  return (
    <Field label="Rows">
      <Input
        type="number"
        inputMode="numeric"
        min={2}
        max={20}
        value={field.extra.rows ?? ''}
        readOnly={readOnly}
        onChange={(event) => {
          const rows = Number.parseInt(event.target.value, 10);
          actions.edit((form) => {
            setFieldProp(form, field.uid, 'rows', Number.isNaN(rows) ? undefined : rows);
          }, `${field.uid}:rows`);
        }}
      />
    </Field>
  );
}

export function AnswerSettings(props: Props) {
  const { field, actions, readOnly } = props;
  const form = useForm();
  const parent = findField(form, field.parent ?? '');
  const row = isMatrix(parent);
  const files = field.type === 'file' && !!field.extra.multiple;
  const limits = limitSpec(files ? 'files' : field.type);
  const shuffles = hasOptions(field.type) && !row;
  const choices = shuffles && field.type !== 'select';
  const pictures = choices && field.options.some((option) => option.extra?.image);
  const parts = [
    field.type === 'section' && childrenOf(form, field.uid).length > 0 && (
      <SettingSwitch
        key="matrix"
        label="Show as matrix"
        checked={isMatrix(field)}
        actions={actions}
        readOnly={readOnly}
        onChange={(draft, next) => {
          setMatrix(draft, field.uid, next);
        }}
      />
    ),
    field.type === 'group' && <GroupSettings key="group" {...props} />,
    takesPlaceholder(field) && <FieldText key="text" {...props} />,
    field.type === 'file' && (
      <SettingSwitch
        key="multiple"
        label="Allow several files"
        checked={files}
        actions={actions}
        readOnly={readOnly}
        onChange={(draft, next) => {
          setMultiple(draft, field.uid, next);
        }}
      />
    ),
    isScale(field.type) && <ScaleSettings key="scale" {...props} />,
    limits && <LimitSettings key="limits" spec={limits} {...props} />,
    field.type === 'textarea' && <Rows key="rows" {...props} />,
    pictures && <PerRow key="columns" field={field} actions={actions} />,
    choices && !pictures && <OptionLayout key="layout" field={field} actions={actions} />,
    shuffles && <RandomizeSetting key="randomize" {...props} />,
    canAutoAdvance(field.type) && parent?.type !== 'group' && !row && (
      <SettingSwitch
        key="advance"
        label="Go to the next step when picked"
        checked={field.extra.autoAdvance ?? false}
        actions={actions}
        readOnly={readOnly}
        onChange={(draft, next) => {
          setFieldProp(draft, field.uid, 'autoAdvance', next || undefined);
        }}
      />
    ),
  ].filter(Boolean);
  if (!parts.length) return null;
  return <SettingsSection title={titleOf(field)}>{parts}</SettingsSection>;
}

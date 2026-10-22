import type { BuilderForm } from '@formhaus/builder';
import { Switch } from '../ui';
import type { SwitchProps } from '../ui/components/Switch/Switch';
import type { EditorActions } from '../useEditorActions';
import styles from './Inspector.module.css';

type Props = Omit<SwitchProps, 'onCheckedChange' | 'disabled' | 'className'> & {
  actions: EditorActions;
  readOnly: boolean;
  onChange: (form: BuilderForm, next: boolean) => void;
};

export function SettingSwitch({ actions, readOnly, onChange, ...rest }: Props) {
  return (
    <Switch
      className={styles.toggle}
      disabled={readOnly}
      onCheckedChange={(next) => {
        actions.edit((form) => {
          onChange(form, next);
        });
      }}
      {...rest}
    />
  );
}

import { SegmentedControl, Text } from '../ui';
import type { SegmentedControlProps } from '../ui/components/SegmentedControl/SegmentedControl';
import styles from './Inspector.module.css';

type Props = Pick<SegmentedControlProps, 'label' | 'options' | 'value' | 'onValueChange'>;

export function SegmentedSetting({ label, ...rest }: Props) {
  return (
    <div className={styles.control}>
      <Text size="sm" tone="muted" weight="medium">
        {label}
      </Text>
      <SegmentedControl label={label} {...rest} />
    </div>
  );
}

import { Component, Suspense, useState, type ReactNode } from 'react';
import { Banner, SegmentedControl, Skeleton } from '../ui';
import { cx } from '../ui/lib/cx';
import { useHost } from '../store/context';
import { useDefinition } from '../store/hooks';
import { phone, useMedia } from '../useMedia';
import styles from './EditorPreview.module.css';

class Guard extends Component<{ children: ReactNode; reset: unknown }, { failed: boolean; reset: unknown }> {
  override state = { failed: false, reset: this.props.reset };

  static getDerivedStateFromError() {
    return { failed: true };
  }

  static getDerivedStateFromProps(props: { reset: unknown }, state: { failed: boolean; reset: unknown }) {
    return props.reset === state.reset ? null : { failed: false, reset: props.reset };
  }

  override render() {
    if (this.state.failed) {
      return (
        <Banner tone="warning" title="The preview cannot show this form yet">
          Fix the highlighted issues in Edit, then come back.
        </Banner>
      );
    }
    return this.props.children;
  }
}

export function EditorPreview() {
  const definition = useDefinition();
  const { Preview } = useHost();
  const [device, setDevice] = useState('desktop');
  const small = useMedia(phone);
  return (
    <div className={styles.preview}>
      {!small && (
        <SegmentedControl
          label="Preview width"
          options={[
            { value: 'desktop', label: 'Desktop' },
            { value: 'mobile', label: 'Phone' },
          ]}
          value={device}
          onValueChange={setDevice}
        />
      )}
      <div className={cx(styles.frame, device === 'mobile' && styles.mobile)}>
        <Guard reset={definition}>
          <Suspense fallback={<Skeleton height="var(--fh-ed-size-tile)" />}>
            <Preview definition={definition} />
          </Suspense>
        </Guard>
      </div>
    </div>
  );
}

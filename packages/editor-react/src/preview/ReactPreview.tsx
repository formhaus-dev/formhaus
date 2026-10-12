import '@formhaus/core/style.css';
import type { FormDefinition } from '@formhaus/core';
import { FormRenderer } from '@formhaus/react';
import { RotateCcw } from 'lucide-react';
import { useState } from 'react';
import { Button } from '../ui/components/Button/Button';
import { Text } from '../ui/components/Text/Text';
import styles from './ReactPreview.module.css';
import { useDarkPage } from './useDarkPage';

export default function ReactPreview({ definition }: { definition: FormDefinition }) {
  const dark = useDarkPage();
  const [round, setRound] = useState(0);
  const [sent, setSent] = useState(false);
  return (
    <section className={styles.panel} aria-label="Preview">
      <Text size="sm" tone="muted">
        Nothing is sent.
      </Text>
      {sent ? (
        <div role="status" className={styles.sent}>
          <Text weight="medium">Preview only, nothing was sent</Text>
          <Button
            icon={<RotateCcw aria-hidden />}
            onClick={() => {
              setSent(false);
              setRound((value) => value + 1);
            }}
          >
            Start over
          </Button>
        </div>
      ) : (
        <div className={styles.sample} data-fh-theme={dark ? 'dark' : 'light'}>
          <FormRenderer
            key={round}
            definition={definition}
            onSubmit={() => {
              setSent(true);
            }}
          />
        </div>
      )}
    </section>
  );
}

import type { FormDefinition } from '@formhaus/core';
import { FormRenderer } from '@formhaus/react';
import { Check, RotateCcw } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { Button } from '../ui/components/Button/Button';
import { Text } from '../ui/components/Text/Text';
import styles from './ReactPreview.module.css';
import { useDarkPage } from './useDarkPage';

export default function ReactPreview({ definition }: { definition: FormDefinition }) {
  const dark = useDarkPage();
  const [round, setRound] = useState(0);
  const [payload, setPayload] = useState<Record<string, unknown> | null>(null);
  const result = useRef<HTMLDivElement>(null);
  const card = useRef<HTMLElement>(null);
  useEffect(() => {
    if (payload) result.current?.focus();
  }, [payload]);
  useEffect(() => {
    if (round > 0) card.current?.querySelector<HTMLElement>('input, select, textarea, button')?.focus();
  }, [round]);
  return (
    <section ref={card} className={styles.card} aria-label="Preview" data-fh-theme={dark ? 'dark' : 'light'}>
      {payload ? (
        <div ref={result} role="status" tabIndex={-1} className={styles.done}>
          <Text className={styles.tick}>
            <Check aria-hidden />
          </Text>
          <Text as="h2" className={styles.title}>
            Submitted
          </Text>
          <Text as="p" tone="muted">
            This is a preview, so nothing was sent. Your submit handler would receive this payload.
          </Text>
          <Text as="pre" size="sm" mono className={styles.payload}>
            {JSON.stringify(payload, null, 2)}
          </Text>
          <Button
            icon={<RotateCcw aria-hidden />}
            onClick={() => {
              setPayload(null);
              setRound((value) => value + 1);
            }}
          >
            Start over
          </Button>
        </div>
      ) : (
        <>
          {(definition.title || definition.description) && (
            <div className={styles.intro}>
              {definition.title && (
                <Text as="h2" className={styles.title}>
                  {definition.title}
                </Text>
              )}
              {definition.description && (
                <Text as="p" tone="muted" className={styles.lead}>
                  {definition.description}
                </Text>
              )}
            </div>
          )}
          <div className={styles.sample}>
            <FormRenderer
              key={round}
              definition={definition}
              onSubmit={(values) => {
                setPayload(values);
              }}
            />
          </div>
        </>
      )}
    </section>
  );
}

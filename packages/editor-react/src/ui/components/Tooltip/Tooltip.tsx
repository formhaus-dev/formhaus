import * as RadixTooltip from '@radix-ui/react-tooltip';
import { useState, type ReactElement, type ReactNode } from 'react';
import { useDragActive } from '../../lib/dragState';
import styles from './Tooltip.module.css';
import { layer } from '../../lib/layer';

export interface TooltipProps {
  content: ReactNode;
  children: ReactElement;
  side?: 'top' | 'right' | 'bottom' | 'left' | undefined;
}

export function TooltipProvider({ children }: { children: ReactNode }) {
  return (
    <RadixTooltip.Provider delayDuration={300} skipDelayDuration={200}>
      {children}
    </RadixTooltip.Provider>
  );
}

export function Tooltip({ content, children, side = 'top' }: TooltipProps) {
  const dragging = useDragActive();
  const [open, setOpen] = useState(false);
  return (
    <RadixTooltip.Root
      open={open && !dragging}
      onOpenChange={(next) => {
        setOpen(next && !dragging);
      }}
    >
      <RadixTooltip.Trigger asChild>{children}</RadixTooltip.Trigger>
      <RadixTooltip.Portal>
        <RadixTooltip.Content {...layer} className={styles.content} side={side} sideOffset={6} collisionPadding={8}>
          {content}
        </RadixTooltip.Content>
      </RadixTooltip.Portal>
    </RadixTooltip.Root>
  );
}

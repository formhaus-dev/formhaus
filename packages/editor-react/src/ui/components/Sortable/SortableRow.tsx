import type { DraggableAttributes } from '@dnd-kit/core';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import type { KeyboardEventHandler, MouseEventHandler, ReactNode, TouchEventHandler } from 'react';
import { cx } from '../../lib/cx';
import styles from './Sortable.module.css';

export interface SortableHandleProps extends DraggableAttributes {
  ref: (element: HTMLElement | null) => void;
  'aria-label': string;
  onKeyDown?: KeyboardEventHandler;
  onMouseDown?: MouseEventHandler;
  onTouchStart?: TouchEventHandler;
}

type Listeners = Pick<SortableHandleProps, 'onKeyDown' | 'onMouseDown' | 'onTouchStart'>;

export interface SortableRenderState {
  handleProps: SortableHandleProps;
  isDragging: boolean;
  overlay: boolean;
}

interface RowProps {
  id: string;
  label: string;
  className?: string | undefined;
  render: (state: SortableRenderState) => ReactNode;
}

export function SortableRow({ id, label, className, render }: RowProps) {
  const { attributes, listeners, setNodeRef, setActivatorNodeRef, transform, transition, isDragging } = useSortable({ id });
  const handleProps: SortableHandleProps = {
    ...attributes,
    ...(listeners as Listeners | undefined),
    ref: setActivatorNodeRef,
    'aria-label': `Reorder ${label}`,
  };
  return (
    <li
      ref={setNodeRef}
      className={cx(styles.row, isDragging && styles.dragging, className)}
      style={{ transform: CSS.Translate.toString(transform), transition }}
      data-dragging={isDragging || undefined}
    >
      {render({ handleProps, isDragging, overlay: false })}
    </li>
  );
}

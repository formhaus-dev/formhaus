import {
  closestCenter,
  DndContext,
  DragOverlay,
  KeyboardSensor,
  MouseSensor,
  TouchSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent,
  type Modifier,
  type UniqueIdentifier,
} from '@dnd-kit/core';
import { SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { useState, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { cx } from '../../lib/cx';
import { instructions, moveAnnouncements } from './announcements';
import styles from './Sortable.module.css';
import { overlayHandle } from './overlay';
import { SortableRow, type SortableRenderState } from './SortableRow';

const vertical: Modifier = ({ transform }) => ({ ...transform, x: 0 });

export interface SortableProps<T extends { id: string }> {
  items: T[];
  label: string;
  getLabel: (item: T) => string;
  onMove: (id: string, toIndex: number) => void;
  renderItem: (item: T, state: SortableRenderState) => ReactNode;
  describeMove?: (label: string, position: number, total: number) => string;
  className?: string;
  itemClassName?: string;
}

export function Sortable<T extends { id: string }>({
  items,
  label,
  getLabel,
  onMove,
  renderItem,
  describeMove,
  className,
  itemClassName,
}: SortableProps<T>) {
  const sensors = useSensors(
    useSensor(MouseSensor, { activationConstraint: { distance: 4 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 250, tolerance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );
  const [active, setActive] = useState<string | null>(null);
  const ids = items.map((item) => item.id);
  const find = (id: UniqueIdentifier) => items.find((item) => item.id === id);
  const announcements = moveAnnouncements({
    label: (id) => {
      const item = find(id);
      return item ? getLabel(item) : String(id);
    },
    position: (id) => ids.indexOf(String(id)) + 1,
    total: items.length,
    describe: describeMove,
  });

  function start({ active: dragged }: DragStartEvent) {
    setActive(String(dragged.id));
  }

  function end({ active: dragged, over }: DragEndEvent) {
    setActive(null);
    if (!over || dragged.id === over.id) return;
    onMove(String(dragged.id), ids.indexOf(String(over.id)));
  }

  const lifted = active ? find(active) : undefined;

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      modifiers={[vertical]}
      accessibility={{ announcements, screenReaderInstructions: instructions }}
      onDragStart={start}
      onDragEnd={end}
      onDragCancel={() => {
        setActive(null);
      }}
    >
      <SortableContext items={ids} strategy={verticalListSortingStrategy}>
        <ul aria-label={label} className={cx(styles.list, className)}>
          {items.map((item) => (
            <SortableRow
              key={item.id}
              id={item.id}
              label={getLabel(item)}
              className={itemClassName}
              render={(state) => renderItem(item, state)}
            />
          ))}
        </ul>
      </SortableContext>
      {createPortal(
        <DragOverlay modifiers={[vertical]} dropAnimation={null}>
          {lifted && (
            <div className={styles.overlay}>{renderItem(lifted, { handleProps: overlayHandle(getLabel(lifted)), isDragging: true })}</div>
          )}
        </DragOverlay>,
        document.body,
      )}
    </DndContext>
  );
}

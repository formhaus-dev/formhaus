import type { LabelKey } from '@formhaus/core';
import { moveButtonId } from '@formhaus/core/internal';
import { DefaultGroupItem, type GroupItemComponentProps, useFileText } from '@formhaus/react';

export function ReorderGroupItem(props: GroupItemComponentProps) {
  const { label } = useFileText();
  const { move, index, count = 0, titleId, disabled } = props;
  const button = (key: LabelKey, to: number) => (
    <button
      id={moveButtonId(titleId, to < index)}
      type="button"
      className="fh-form-actions__button fh-form-actions__button--text fh-group__move"
      aria-describedby={titleId}
      disabled={disabled || to < 0 || to >= count}
      onClick={() => move?.(to)}
    >
      {label(key)}
    </button>
  );
  return (
    <DefaultGroupItem
      {...props}
      actions={
        move && (
          <span className="fh-group__reorder">
            {button('moveUp', index - 1)}
            {button('moveDown', index + 1)}
          </span>
        )
      }
    />
  );
}

import type { ComponentPropsWithRef, ReactNode } from 'react';
import { buttonVariants, type ButtonVariants } from '../Button/variants';
import { Kbd } from '../Kbd/Kbd';
import { Tooltip, type TooltipProps } from '../Tooltip/Tooltip';

export type IconButtonProps = Omit<ComponentPropsWithRef<'button'>, 'children' | 'aria-label'> &
  Pick<ButtonVariants, 'variant' | 'size'> & {
    label: string;
    tooltip?: string;
    icon: ReactNode;
    tooltipSide?: TooltipProps['side'];
    shortcut?: string;
  };

export function IconButton({
  label,
  tooltip = label,
  icon,
  variant = 'ghost',
  size,
  className,
  tooltipSide,
  shortcut,
  type = 'button',
  ...rest
}: IconButtonProps) {
  return (
    <Tooltip
      content={
        shortcut ? (
          <>
            {tooltip} <Kbd>{shortcut}</Kbd>
          </>
        ) : (
          tooltip
        )
      }
      side={tooltipSide}
    >
      <button type={type} aria-label={label} className={buttonVariants({ variant, size, iconOnly: true, className })} {...rest}>
        {icon}
      </button>
    </Tooltip>
  );
}

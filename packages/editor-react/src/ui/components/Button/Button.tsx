import type { ComponentPropsWithRef, ReactNode } from 'react';
import { AppLink, type AppLinkProps } from '../AppLink/AppLink';
import { Spinner } from '../Spinner/Spinner';
import { buttonVariants, type ButtonVariants } from './variants';

type Look = Omit<ButtonVariants, 'iconOnly'> & { icon?: ReactNode };

function label(children: ReactNode, collapse: Look['collapse']) {
  return collapse === 'md' ? <span className="fh-ed-sr-only-md">{children}</span> : children;
}

export type ButtonProps = ComponentPropsWithRef<'button'> & Look & { loading?: boolean };

export function Button({
  variant,
  size,
  block,
  align,
  collapse,
  icon,
  loading = false,
  disabled,
  className,
  children,
  type = 'button',
  ...rest
}: ButtonProps) {
  return (
    <button
      type={type}
      className={buttonVariants({ variant, size, block, align, collapse, className })}
      disabled={disabled === true || loading}
      aria-busy={loading || undefined}
      {...rest}
    >
      {loading ? <Spinner size="sm" label="" /> : icon}
      {label(children, collapse)}
    </button>
  );
}

export type LinkButtonProps = AppLinkProps & Look;

export function LinkButton({ variant, size, block, align, collapse, icon, className, children, ...rest }: LinkButtonProps) {
  return (
    <AppLink className={buttonVariants({ variant, size, block, align, collapse, className })} {...rest}>
      {icon}
      {label(children, collapse)}
    </AppLink>
  );
}

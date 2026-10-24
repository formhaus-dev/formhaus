import type { ControlShellProps } from '@formhaus/react/controls';
import { Texts } from './GroupMessage';

export function InlineShell({ f, rootProps, children }: ControlShellProps) {
  return (
    <div {...rootProps}>
      {children}
      <Texts id={f.id} helperText={f.helperText} error={f.error} />
    </div>
  );
}

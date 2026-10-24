import { type ControlShellProps, mapControls } from '@formhaus/react/controls';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';

function MatrixShell({ f, rootProps, children }: ControlShellProps) {
  return (
    <div {...rootProps} className="grid items-center gap-0 border-b last:border-b-0 [grid-template-columns:var(--matrix)]">
      <span className="px-3 py-2.5 text-sm">
        <span id={`${f.id}-label`}>{f.label}</span>
        {f.helperText && (
          <span id={f.helperId} className="block text-xs text-muted-foreground">
            {f.helperText}
          </span>
        )}
        {f.error && (
          <span id={f.errorId} className="block text-xs text-destructive">
            {f.error}
          </span>
        )}
      </span>
      {children}
    </div>
  );
}

export const MatrixRow = mapControls({
  shell: MatrixShell,
  controls: {
    radio: [
      RadioGroup,
      (f, options) => ({
        className: 'contents',
        'aria-labelledby': `${f.id}-label`,
        children: options.map((column) => (
          <span key={column.value} className="flex justify-center py-2.5">
            <RadioGroupItem value={column.value} aria-label={column.label} />
          </span>
        )),
      }),
      'onValueChange',
    ],
  },
}).radio;

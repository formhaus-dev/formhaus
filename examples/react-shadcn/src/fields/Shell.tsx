import type { ControlShellProps } from '@formhaus/react/controls';
import { Label } from '@/components/ui/label';

export function Shell({ kind, f, rootProps, anchors, children }: ControlShellProps) {
  const text = (
    <span>
      {f.label}
      {f.required && (
        <span aria-hidden="true" className="text-destructive">
          {' *'}
        </span>
      )}
    </span>
  );
  const texts = (
    <>
      {anchors.some(Boolean) && (
        <div className="flex justify-between text-xs text-muted-foreground">
          {anchors.map((anchor, index) => (
            <span key={index}>{anchor?.label}</span>
          ))}
        </div>
      )}
      {f.helperText && (
        <p id={f.helperId} className="text-sm text-muted-foreground">
          {f.helperText}
        </p>
      )}
      {f.error && (
        <p id={f.errorId} className="text-sm text-destructive">
          {f.error}
        </p>
      )}
    </>
  );
  if (kind === 'group')
    return (
      <fieldset {...rootProps} className="grid gap-2">
        <legend className="mb-2 text-sm leading-none font-medium">{text}</legend>
        {children}
        {texts}
      </fieldset>
    );
  return (
    <div {...rootProps} className="grid gap-2">
      {kind === 'input' ? (
        <>
          <Label htmlFor={f.id}>{text}</Label>
          {children}
        </>
      ) : (
        <div className="flex items-center gap-2">
          {children}
          <Label htmlFor={f.id} className="font-normal">
            {text}
          </Label>
        </div>
      )}
      {texts}
    </div>
  );
}

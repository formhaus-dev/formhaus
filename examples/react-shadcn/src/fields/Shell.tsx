import type { ControlShellProps } from '@formhaus/react/controls';
import { Field, FieldDescription, FieldError, FieldLabel, FieldLegend, FieldSet } from '@/components/ui/field';
import { cn } from '@/lib/utils';

export function RequiredMark({ f }: Pick<ControlShellProps, 'f'>) {
  return f.required ? (
    <span aria-hidden="true" className="text-destructive">
      {' *'}
    </span>
  ) : null;
}

export function Shell({ kind, field, f, rootProps, anchors, children }: ControlShellProps) {
  const text = (
    <span>
      {f.label}
      <RequiredMark f={f} />
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
      {f.helperText && <FieldDescription id={f.helperId}>{f.helperText}</FieldDescription>}
      {f.error && <FieldError id={f.errorId}>{f.error}</FieldError>}
    </>
  );
  if (kind === 'group')
    return (
      <FieldSet
        {...rootProps}
        data-invalid={f.invalid || undefined}
        className={cn(
          'gap-2',
          field.layout === 'inline' &&
            '*:data-[slot=radio-group]:flex *:data-[slot=radio-group]:flex-wrap *:data-[slot=radio-group]:gap-x-6',
        )}
      >
        <FieldLegend variant="label" className={cn('mb-2', f.invalid && 'text-destructive')}>
          {text}
        </FieldLegend>
        {children}
        {texts}
      </FieldSet>
    );
  return (
    <Field {...rootProps} data-invalid={f.invalid || undefined}>
      {kind === 'input' ? (
        <>
          <FieldLabel htmlFor={f.id}>{text}</FieldLabel>
          {children}
        </>
      ) : (
        <div className="flex items-center gap-2">
          {children}
          <FieldLabel htmlFor={f.id} className="font-normal">
            {text}
          </FieldLabel>
        </div>
      )}
      {texts}
    </Field>
  );
}

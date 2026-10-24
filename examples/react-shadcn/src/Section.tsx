import type { SectionComponentProps } from '@formhaus/react';
import type { CSSProperties } from 'react';

export function Section({ id, title, description, descriptionId, columns, children }: SectionComponentProps) {
  return (
    <fieldset id={id} aria-describedby={descriptionId} className="grid gap-3">
      <legend className="mb-3 text-sm font-medium">{title}</legend>
      {description && (
        <p id={descriptionId} className="text-sm text-muted-foreground">
          {description}
        </p>
      )}
      {columns ? (
        <div
          className="overflow-x-auto rounded-lg border"
          style={{ '--matrix': `minmax(7rem, 2fr) repeat(${columns.length}, minmax(3.75rem, 1fr))` } as CSSProperties}
        >
          <div
            className="grid border-b bg-muted/50 text-xs font-medium text-muted-foreground [grid-template-columns:var(--matrix)]"
            aria-hidden="true"
          >
            <span />
            {columns.map((column) => (
              <span key={column.value} className="px-2 py-2 text-center">
                {column.label}
              </span>
            ))}
          </div>
          {children}
        </div>
      ) : (
        children
      )}
    </fieldset>
  );
}

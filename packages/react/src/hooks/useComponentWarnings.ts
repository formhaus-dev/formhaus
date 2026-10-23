import { warnMissingComponents } from '@formhaus/core/internal';
import { useEffect, useState } from 'react';
import type { FormRendererProps } from '../types';

export function useComponentWarnings(props: FormRendererProps): void {
  const [warned] = useState(() => new Set<string>());
  useEffect(() => {
    let warn: (() => void) | undefined;
    try {
      if (process.env.NODE_ENV !== 'production') warn = () => warnMissingComponents(props.definition, props, warned, props.onWarning);
    } catch {}
    warn?.();
  }, [props.definition, props.components, props.actionsComponent, props.progressComponent]);
}

import type { RevealView } from '@formhaus/core';
import type { ReactNode } from 'react';

export function Reveal({ reveal }: { reveal?: RevealView<ReactNode> }) {
  return reveal ? (
    <div id={reveal.id} className="fh-field__reveal" data-fh="reveal" hidden={!reveal.open}>
      {reveal.children}
    </div>
  ) : null;
}

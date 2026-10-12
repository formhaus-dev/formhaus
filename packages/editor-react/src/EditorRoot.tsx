import { useState } from 'react';
import type { EditorHost } from './host';
import { Notices, useNotices } from './root/Notices';
import { EditorScreen } from './shell/EditorScreen';
import type { EditorMode } from './shell/EditorView';
import { TooltipProvider } from './ui';

export interface EditorRootProps {
  host: EditorHost;
  mode?: EditorMode;
}

export function EditorRoot({ host, mode }: EditorRootProps) {
  const { entries, notify, dismiss } = useNotices();
  const [shown] = useState<EditorHost>(() => ({
    ...host,
    notify: (notice) => {
      host.notify(notice);
      notify(notice);
    },
  }));
  return (
    <div className="fh-editor">
      <TooltipProvider>
        <EditorScreen host={shown} {...(mode ? { mode } : {})} />
        <Notices entries={entries} dismiss={dismiss} />
      </TooltipProvider>
    </div>
  );
}

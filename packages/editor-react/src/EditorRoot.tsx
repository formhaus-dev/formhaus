import type { EditorHost } from './host';
import { EditorScreen } from './shell/EditorScreen';
import type { EditorMode } from './shell/EditorView';
import { TooltipProvider } from './ui/components/Tooltip/Tooltip';

export interface EditorRootProps {
  host: EditorHost;
  mode?: EditorMode;
}

export function EditorRoot({ host, mode }: EditorRootProps) {
  return (
    <div className="fh-editor">
      <TooltipProvider>
        <EditorScreen host={host} {...(mode ? { mode } : {})} />
      </TooltipProvider>
    </div>
  );
}

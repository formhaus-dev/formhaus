import { ArrowDown, ArrowUp, Ellipsis, Trash2 } from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger, IconButton } from '../ui';
import type { EditorActions } from '../useEditorActions';

interface Props {
  uid: string;
  position: number;
  total: number;
  actions: EditorActions;
  onDelete: () => void;
}

export function StepMenu({ uid, position, total, actions, onDelete }: Props) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger>
        <IconButton label="Step actions" icon={<Ellipsis aria-hidden />} />
      </DropdownMenuTrigger>
      <DropdownMenuContent>
        <DropdownMenuItem
          icon={<ArrowUp aria-hidden />}
          disabled={position === 1}
          onSelect={() => {
            actions.moveStep(uid, -1);
          }}
        >
          Move step up
        </DropdownMenuItem>
        <DropdownMenuItem
          icon={<ArrowDown aria-hidden />}
          disabled={position === total}
          onSelect={() => {
            actions.moveStep(uid, 1);
          }}
        >
          Move step down
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem icon={<Trash2 aria-hidden />} tone="danger" onSelect={onDelete}>
          Delete step
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

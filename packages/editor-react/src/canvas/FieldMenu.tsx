import { isPage, pageTitle, stepOf } from '@formhaus/builder';
import { ArrowDown, ArrowUp, Copy, CornerDownRight, Ellipsis, Plus, Settings2, SplitSquareVertical, Trash2 } from 'lucide-react';
import { useMemo } from 'react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  IconButton,
} from '../ui';
import { useForm } from '../store/hooks';
import type { EditorActions } from '../useEditorActions';

interface Props {
  uid: string;
  actions: EditorActions;
  onAddBelow: () => void;
  onSettings: () => void;
}

export function FieldMenu(props: Props) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger>
        <IconButton label="Field actions" icon={<Ellipsis aria-hidden />} />
      </DropdownMenuTrigger>
      <DropdownMenuContent>
        <FieldMenuItems {...props} />
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function FieldMenuItems({ uid, actions, onAddBelow, onSettings }: Props) {
  const form = useForm();
  const steps = useMemo(() => {
    const offset = isPage(form.blocks[0]) ? 0 : 1;
    return form.blocks.filter(isPage).map((page, index) => ({ uid: page.uid, title: pageTitle(page, index + offset) }));
  }, [form.blocks]);
  const current = stepOf(form, uid)?.uid;
  const index = form.blocks.findIndex((block) => block.uid === uid);
  const first = index <= (isPage(form.blocks[0]) ? 1 : 0);
  const last = index === form.blocks.length - 1;
  return (
    <>
      <DropdownMenuItem
        icon={<Copy aria-hidden />}
        hint="⌘D"
        onSelect={() => {
          actions.duplicate(uid);
        }}
      >
        Duplicate
      </DropdownMenuItem>
      <DropdownMenuItem icon={<Settings2 aria-hidden />} hint="." onSelect={onSettings}>
        Field settings
      </DropdownMenuItem>
      <DropdownMenuItem icon={<Plus aria-hidden />} onSelect={onAddBelow}>
        Add field below
      </DropdownMenuItem>
      <DropdownMenuItem
        icon={<ArrowUp aria-hidden />}
        hint="⌥↑"
        disabled={first}
        onSelect={() => {
          actions.move(uid, -1);
        }}
      >
        Move up
      </DropdownMenuItem>
      <DropdownMenuItem
        icon={<ArrowDown aria-hidden />}
        hint="⌥↓"
        disabled={last}
        onSelect={() => {
          actions.move(uid, 1);
        }}
      >
        Move down
      </DropdownMenuItem>
      <DropdownMenuItem
        icon={<SplitSquareVertical aria-hidden />}
        disabled={first && !current}
        onSelect={() => {
          actions.split(uid);
        }}
      >
        Start a new step here
      </DropdownMenuItem>
      {steps.length > 1 && (
        <>
          <DropdownMenuSeparator />
          <DropdownMenuLabel>Move to step</DropdownMenuLabel>
          {steps.map((step) => (
            <DropdownMenuItem
              key={step.uid}
              icon={<CornerDownRight aria-hidden />}
              checked={step.uid === current}
              disabled={step.uid === current}
              onSelect={() => {
                actions.moveTo(uid, step.uid, Number.MAX_SAFE_INTEGER);
              }}
            >
              {step.title}
            </DropdownMenuItem>
          ))}
        </>
      )}
      <DropdownMenuSeparator />
      <DropdownMenuItem
        icon={<Trash2 aria-hidden />}
        tone="danger"
        hint="⌫"
        onSelect={() => {
          actions.remove(uid);
        }}
      >
        Delete field
      </DropdownMenuItem>
    </>
  );
}

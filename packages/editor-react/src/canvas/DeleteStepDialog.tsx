import type { StepRemoval } from '@formhaus/builder';
import { Button, Dialog, DialogClose } from '../ui';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  fields: number;
  position: number;
  onDelete: (mode: StepRemoval) => void;
}

export function DeleteStepDialog({ open, onOpenChange, title, fields, position, onDelete }: Props) {
  const target = position === 1 ? 2 : position - 1;
  const noun = fields === 1 ? 'field' : 'fields';
  return (
    <Dialog
      open={open}
      onOpenChange={onOpenChange}
      size="wide"
      title={`Delete “${title}”?`}
      description={fields ? `This step has ${String(fields)} ${noun}. You can undo this.` : 'You can undo this.'}
      footer={
        <>
          <DialogClose asChild>
            <Button>Cancel</Button>
          </DialogClose>
          {fields > 0 && (
            <Button
              onClick={() => {
                onDelete('keep-fields');
              }}
            >
              Move {noun} to step {target}
            </Button>
          )}
          <Button
            variant="danger"
            onClick={() => {
              onDelete('with-fields');
            }}
          >
            {fields ? `Delete step and ${noun}` : 'Delete step'}
          </Button>
        </>
      }
    />
  );
}

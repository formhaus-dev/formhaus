import type { StepRemoval } from '@formhaus/builder';
import { Button, Dialog, DialogClose } from '../ui';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  fields: number;
  first: boolean;
  onDelete: (mode: StepRemoval) => void;
}

export function DeleteStepDialog({ open, onOpenChange, title, fields, first, onDelete }: Props) {
  const keep = first ? 'Move fields to the next step' : 'Move fields to the previous step';
  return (
    <Dialog
      open={open}
      onOpenChange={onOpenChange}
      title={`Delete “${title}”?`}
      description={
        fields ? `This step has ${String(fields)} ${fields === 1 ? 'field' : 'fields'}. You can undo this.` : 'You can undo this.'
      }
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
              {keep}
            </Button>
          )}
          <Button
            variant="danger"
            onClick={() => {
              onDelete('with-fields');
            }}
          >
            {fields ? `Delete step and ${String(fields)} ${fields === 1 ? 'field' : 'fields'}` : 'Delete step'}
          </Button>
        </>
      }
    />
  );
}

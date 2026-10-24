import { Radio } from '@base-ui/react/radio';
import { toggleOption } from '@formhaus/core/fields';
import type { FieldProps } from '@formhaus/react';
import type { ControlOption } from '@formhaus/react/controls';
import { Star } from 'lucide-react';
import { Fragment } from 'react';
import { buttonVariants } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { RadioGroupItem } from '@/components/ui/radio-group';
import { cn } from '@/lib/utils';

export const native = () => ({ nativeButton: true, render: <button type="button" /> });

function Reveal({ reveal }: Pick<ControlOption, 'reveal'>) {
  return reveal ? (
    <div
      id={reveal.id}
      data-fh="reveal"
      role="group"
      hidden={!reveal.open}
      className="ml-1.5 grid gap-5 border-l-2 pl-4"
      onKeyDown={(event) => event.stopPropagation()}
    >
      {reveal.children}
    </div>
  ) : null;
}

interface CheckboxListProps {
  f: FieldProps;
  options: ControlOption[];
  value: unknown;
  onChange: (value: unknown) => void;
}

export function CheckboxList({ f, options, value, onChange }: CheckboxListProps) {
  return (
    <div className="grid gap-2">
      {options.map((option, index) => {
        const { checked, value: picked } = f.option({ ...option, value: String(option.value) }, index);
        return (
          <Fragment key={option.value}>
            <Label className="font-normal">
              <Checkbox
                checked={checked}
                onCheckedChange={() => onChange(toggleOption(value, picked))}
                aria-invalid={f.invalid || undefined}
                aria-controls={option.reveal?.id}
                aria-expanded={option.reveal?.open}
              />
              {option.label}
            </Label>
            <Reveal reveal={option.reveal} />
          </Fragment>
        );
      })}
    </div>
  );
}

const tile =
  'flex-col items-stretch gap-2 rounded-lg border p-2 font-normal has-[[data-checked]]:border-primary has-[[data-checked]]:ring-1 has-[[data-checked]]:ring-primary';

export const radios = (f: FieldProps, options: ControlOption[]) => {
  const tiles = options.some((option) => option.image);
  return {
    className: tiles ? 'grid grid-cols-[repeat(auto-fill,minmax(9rem,1fr))] gap-3' : undefined,
    children: options.map((option) =>
      tiles ? (
        <Label key={option.value} className={tile}>
          {option.image && <img src={option.image} alt="" className="aspect-[4/3] w-full rounded-md object-cover" />}
          <span className="flex items-center gap-2">
            <RadioGroupItem value={option.value} aria-invalid={f.invalid || undefined} />
            {option.label}
          </span>
        </Label>
      ) : (
        <Fragment key={option.value}>
          <Label className="font-normal">
            <RadioGroupItem value={option.value} aria-invalid={f.invalid || undefined} aria-controls={option.reveal?.id} />
            {option.label}
          </Label>
          <Reveal reveal={option.reveal} />
        </Fragment>
      ),
    ),
  };
};

export const points = (f: FieldProps, options: ControlOption[]) => ({
  className: 'gap-1.5',
  style: { gridTemplateColumns: `repeat(${Math.min(options.length, 6)}, minmax(0, 1fr))` },
  children: options.map((option) => (
    <Radio.Root
      key={option.value}
      value={option.value}
      aria-invalid={f.invalid || undefined}
      className={cn(buttonVariants({ variant: f.value === option.value ? 'default' : 'outline', size: 'lg' }))}
    >
      {option.label}
    </Radio.Root>
  )),
});

export const stars = (f: FieldProps, options: ControlOption[]) => ({
  className: 'flex gap-1',
  children: options.map((option) => (
    <Radio.Root
      key={option.value}
      value={option.value}
      aria-label={`${option.label} of ${options.length}`}
      aria-invalid={f.invalid || undefined}
      className={buttonVariants({ variant: 'ghost', size: 'icon' })}
    >
      <Star className={cn('size-6', Number(f.value) >= Number(option.value) ? 'fill-primary text-primary' : 'text-muted-foreground')} />
    </Radio.Root>
  )),
});

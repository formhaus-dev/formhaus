import { Radio } from '@base-ui/react/radio';
import type { FieldProps } from '@formhaus/react';
import type { ControlOption } from '@formhaus/react/controls';
import { Star } from 'lucide-react';
import { buttonVariants } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { RadioGroupItem } from '@/components/ui/radio-group';
import { cn } from '@/lib/utils';

export const native = () => ({ nativeButton: true, render: <button type="button" /> });

export const checkboxes = (_: FieldProps, options: ControlOption[]) => ({
  className: 'grid gap-2',
  children: options.map((option) => (
    <Label key={option.value} className="font-normal">
      <Checkbox value={String(option.value)} />
      {option.label}
    </Label>
  )),
});

const tile =
  'flex-col items-stretch gap-2 rounded-lg border p-2 font-normal has-[[data-checked]]:border-primary has-[[data-checked]]:ring-1 has-[[data-checked]]:ring-primary';

export const radios = (_: FieldProps, options: ControlOption[]) => {
  const tiles = options.some((option) => option.image);
  return {
    className: tiles ? 'grid grid-cols-[repeat(auto-fill,minmax(9rem,1fr))] gap-3' : undefined,
    children: options.map((option) =>
      tiles ? (
        <Label key={option.value} className={tile}>
          {option.image && <img src={option.image} alt="" className="aspect-[4/3] w-full rounded-md object-cover" />}
          <span className="flex items-center gap-2">
            <RadioGroupItem value={option.value} />
            {option.label}
          </span>
        </Label>
      ) : (
        <Label key={option.value} className="font-normal">
          <RadioGroupItem value={option.value} />
          {option.label}
        </Label>
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
      className={buttonVariants({ variant: 'ghost', size: 'icon' })}
    >
      <Star className={cn('size-6', Number(f.value) >= Number(option.value) ? 'fill-primary text-primary' : 'text-muted-foreground')} />
    </Radio.Root>
  )),
});

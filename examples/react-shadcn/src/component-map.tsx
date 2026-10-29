import type { FieldComponentMap } from '@formhaus/react';
import { mapControls } from '@formhaus/react/controls';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { RadioGroup } from '@/components/ui/radio-group';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { AutocompleteInput } from './fields/AutocompleteInput';
import { CheckboxList, native, points, radios, stars } from './fields/choices';
import { FileInput } from './fields/FileInput';
import { MatrixRow } from './fields/MatrixRow';
import { SelectControl } from './fields/SelectControl';
import { Shell } from './fields/Shell';

export const components: FieldComponentMap = mapControls({
  shell: Shell,
  matrix: MatrixRow,
  freeText: true,
  conditionalReveal: ['radio', 'multiselect'],
  controls: {
    input: Input,
    textarea: Textarea,
    select: { component: SelectControl, optionsProp: 'options' },
    autocomplete: { component: AutocompleteInput, optionsProp: 'options' },
    multiselect: { component: CheckboxList, props: (f, options) => ({ f, options }) },
    checkbox: { component: Checkbox, props: native, changeProp: 'onCheckedChange' },
    switch: { component: Switch, props: native, changeProp: 'onCheckedChange' },
    radio: { component: RadioGroup, props: radios, changeProp: 'onValueChange' },
    scale: { component: RadioGroup, props: points, changeProp: 'onValueChange' },
    rating: { component: RadioGroup, props: stars, changeProp: 'onValueChange' },
    file: { component: FileInput, props: (f) => ({ f }) },
  },
});

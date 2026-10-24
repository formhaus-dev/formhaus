import type { FieldComponentMap } from '@formhaus/react';
import { mapControls } from '@formhaus/react/controls';
import { CheckboxGroup } from '@base-ui/react/checkbox-group';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { RadioGroup } from '@/components/ui/radio-group';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { AutocompleteInput } from './fields/AutocompleteInput';
import { checkboxes, native, points, radios, stars } from './fields/choices';
import { MatrixRow } from './fields/MatrixRow';
import { SelectControl } from './fields/SelectControl';
import { Shell } from './fields/Shell';

export const components: FieldComponentMap = mapControls({
  shell: Shell,
  matrix: MatrixRow,
  controls: {
    input: Input,
    textarea: Textarea,
    select: [SelectControl, 'options'],
    autocomplete: [AutocompleteInput, (f) => ({ options: f.options })],
    multiselect: [CheckboxGroup, checkboxes, 'onValueChange'],
    checkbox: [Checkbox, native, 'onCheckedChange'],
    switch: [Switch, native, 'onCheckedChange'],
    radio: [RadioGroup, radios, 'onValueChange'],
    scale: [RadioGroup, points, 'onValueChange'],
    rating: [RadioGroup, stars, 'onValueChange'],
  },
});

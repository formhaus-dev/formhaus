import type { SortableHandleProps } from './SortableRow';

export const overlayHandle = (label: string): SortableHandleProps => ({
  role: 'button',
  tabIndex: -1,
  'aria-disabled': true,
  'aria-pressed': undefined,
  'aria-roledescription': 'sortable',
  'aria-describedby': '',
  ref: () => undefined,
  'aria-label': `Reorder ${label}`,
});

import { render } from '@testing-library/react';
import type { ReactElement } from 'react';
import { TooltipProvider } from '../components/Tooltip/Tooltip';

export function renderWithProviders(ui: ReactElement) {
  return render(<TooltipProvider>{ui}</TooltipProvider>);
}

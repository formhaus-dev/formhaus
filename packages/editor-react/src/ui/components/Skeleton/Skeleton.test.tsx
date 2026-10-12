import { render } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { Skeleton } from './Skeleton';

describe('Skeleton', () => {
  it('is hidden from assistive tech and takes a size', () => {
    const { container } = render(<Skeleton width={120} height={14} />);
    const block = container.firstElementChild;
    expect(block).toHaveAttribute('aria-hidden', 'true');
    expect(block).toHaveStyle({ width: '120px', height: '14px' });
  });
});

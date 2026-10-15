import '../../styles/tokens.css';
import '../../styles/base.css';
import { cleanup, render, screen } from '@testing-library/react';
import { Copy } from 'lucide-react';
import { afterEach, describe, expect, it } from 'vitest';
import { page, userEvent } from 'vitest/browser';
import { Notices } from '../../root/Notices';
import {
  AddRow,
  Button,
  CommandList,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  IconButton,
  SegmentedControl,
  Switch,
  TextLink,
  TooltipProvider,
} from '..';
import { offCenter } from './centering';

const cursor = (element: Element | null) => (element ? getComputedStyle(element).cursor : 'missing');

function Samples() {
  return (
    <div className="fh-editor">
      <TooltipProvider>
        <Button icon={<Copy aria-hidden />}>Copy JSON</Button>
        <IconButton label="Duplicate" icon={<Copy aria-hidden />} />
        <SegmentedControl
          label="Mode"
          value="a"
          options={[
            { value: 'a', label: 'Visual' },
            { value: 'b', label: 'JSON' },
          ]}
        />
        <AddRow label="Add field" onClick={() => undefined} />
        <CommandList label="Types" items={[{ id: 'text', label: 'Short text' }]} onSelect={() => undefined} />
        <Switch label="Required" />
        <TextLink href="/schema">Schema</TextLink>
        <button type="button" aria-disabled="true">
          Publish
        </button>
        <DropdownMenu>
          <DropdownMenuTrigger>
            <button type="button">Open menu</button>
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuItem icon={<Copy aria-hidden />}>Duplicate field</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
        <Notices
          entries={[{ id: 1, title: 'Field deleted', action: { label: 'Undo', onClick: () => undefined } }]}
          dismiss={() => undefined}
        />
      </TooltipProvider>
    </div>
  );
}

describe.each([1440, 390])('editor primitives at %i', (width) => {
  afterEach(() => {
    cleanup();
  });

  it('keeps every single-row control within 1px of its centre', async () => {
    await page.viewport(width, 900);
    render(<Samples />);
    await userEvent.click(screen.getByRole('button', { name: 'Open menu' }));
    const rows: [string, Element | null][] = [
      ['button', screen.getByText('Copy JSON').closest('button')],
      ['segment', screen.getByText('Visual')],
      ['add row', screen.getByText('Add field').closest('button')],
      ['option', screen.getByRole('option', { name: 'Short text' })],
      ['menu item', await screen.findByRole('menuitem', { name: /Duplicate field/ })],
      ['notice', screen.getByText('Field deleted').closest('li')],
    ];
    const failures = rows.flatMap(([name, row]) =>
      row ? offCenter(row).map((offset) => `${name}: ${offset.part} ${String(offset.delta)}px`) : [`${name}: missing`],
    );
    expect(failures).toEqual([]);
  });

  it('shows a pointer on everything clickable and not on disabled actions', async () => {
    await page.viewport(width, 900);
    render(<Samples />);
    expect(cursor(screen.getByText('JSON'))).toBe('pointer');
    expect(cursor(screen.getByRole('button', { name: 'Duplicate' }))).toBe('pointer');
    expect(cursor(screen.getByRole('option', { name: 'Short text' }))).toBe('pointer');
    expect(cursor(screen.getByRole('switch', { name: 'Required' }))).toBe('pointer');
    expect(cursor(screen.getByRole('link', { name: 'Schema' }))).toBe('pointer');
    expect(cursor(screen.getByRole('button', { name: 'Add field' }))).toBe('pointer');
    expect(cursor(screen.getByRole('button', { name: 'Publish' }))).toBe('default');
    await userEvent.click(screen.getByRole('button', { name: 'Open menu' }));
    expect(cursor(await screen.findByRole('menuitem', { name: /Duplicate field/ }))).toBe('pointer');
  });
});

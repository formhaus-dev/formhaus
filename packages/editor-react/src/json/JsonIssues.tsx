import type { Ref } from 'react';
import type { DefinitionIssue, FormDefinition } from '@formhaus/core';
import type { DefinitionFix, FixableIssue } from '@formhaus/core/fix';
import { ChevronDown, CircleAlert, TriangleAlert, WandSparkles } from 'lucide-react';
import { Button, DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, Tooltip, useAnnounce } from '../ui';
import { cx } from '../ui/lib/cx';
import type { FixTools } from './fixes';
import styles from './JsonPane.module.css';

type Target = { pointer: string; part: 'value' | 'key' };
type Apply = (change: (definition: FormDefinition) => FormDefinition, target?: Target) => boolean;

function targetOf(fix: DefinitionFix): Target | undefined {
  const last = fix.patch.at(-1);
  if (!last) return undefined;
  if (last.op === 'move') return { pointer: last.path, part: 'key' };
  if ((last.op === 'add' || last.op === 'replace') && ['string', 'number'].includes(typeof last.value))
    return { pointer: last.path, part: 'value' };
  return undefined;
}

interface Props {
  issues: (DefinitionIssue & FixableIssue)[];
  tools: FixTools | null;
  onApply: Apply;
}

function FixControl({ issue, onFix }: { issue: FixableIssue; onFix: (fix: DefinitionFix) => void }) {
  const fixes = issue.fixes ?? [];
  const [fix] = fixes;
  if (fix && fixes.length === 1) {
    return (
      <Tooltip content={fix.title}>
        <Button
          variant="ghost"
          className={styles.fix}
          aria-label={`Fix: ${fix.title}`}
          onClick={() => {
            onFix(fix);
          }}
        >
          Fix
        </Button>
      </Tooltip>
    );
  }
  return (
    <DropdownMenu>
      <DropdownMenuTrigger>
        <Button variant="ghost" className={styles.fix} aria-label={`Fixes for ${issue.path || 'the form'}`}>
          Fix
          <ChevronDown aria-hidden />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent>
        {fixes.map((fix) => (
          <DropdownMenuItem
            key={fix.title}
            onSelect={() => {
              onFix(fix);
            }}
          >
            {fix.title}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function useFixActions(tools: FixTools | null, onApply: Apply) {
  const announce = useAnnounce();
  return {
    fixOne: (fix: DefinitionFix) => {
      if (tools && onApply((definition) => tools.applyFix(definition, fix.patch), targetOf(fix))) announce(`Applied: ${fix.title}`);
    },
    fixSafe: () => {
      if (!tools) return;
      let count = 0;
      const changed = onApply((definition) => {
        const result = tools.fixAll(definition);
        count = result.applied.length;
        return result.definition;
      });
      if (changed) announce(count === 1 ? 'Applied 1 fix' : `Applied ${String(count)} fixes`);
    },
  };
}

export function FixAllButton({ issues, tools, onApply }: Props) {
  const { fixSafe } = useFixActions(tools, onApply);
  const safe = issues.filter((issue) => issue.fixes?.some((fix) => fix.safe)).length;
  if (!tools || !safe) return null;
  return (
    <Button className={styles.fixAll} icon={<WandSparkles aria-hidden />} onClick={fixSafe}>
      Fix all safe issues ({safe})
    </Button>
  );
}

export function JsonIssues({ issues, tools, onApply, listRef }: Props & { listRef?: Ref<HTMLUListElement> }) {
  const { fixOne } = useFixActions(tools, onApply);
  return (
    <ul ref={listRef} className={styles.issues} aria-label="Definition issues" tabIndex={-1}>
      {issues.map((issue, index) => {
        const Icon = issue.severity === 'error' ? CircleAlert : TriangleAlert;
        return (
          <li key={`${String(index)}-${issue.message}`} className={styles.issue}>
            <span className={styles.message}>
              <Icon aria-hidden className={cx(styles.icon, issue.severity === 'error' ? styles.errorIcon : styles.warningIcon)} />
              {issue.message}
            </span>
            {tools && issue.fixes && <FixControl issue={issue} onFix={fixOne} />}
          </li>
        );
      })}
    </ul>
  );
}

import type { DefinitionIssue, FormDefinition } from '@formhaus/core';
import type { DefinitionFix, FixableIssue } from '@formhaus/core/fix';
import { ChevronDown, CircleAlert, TriangleAlert, WandSparkles } from 'lucide-react';
import { Button, DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, Tooltip, useAnnounce } from '../ui';
import { cx } from '../ui/lib/cx';
import type { FixTools } from './fixes';
import styles from './JsonPane.module.css';

type Apply = (change: (definition: FormDefinition) => FormDefinition) => boolean;

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

export function JsonIssues({ issues, tools, onApply }: Props) {
  const announce = useAnnounce();
  const safe = issues.filter((issue) => issue.fixes?.some((fix) => fix.safe)).length;
  const fixOne = (fix: DefinitionFix) => {
    if (tools && onApply((definition) => tools.applyFix(definition, fix.patch))) announce(`Applied: ${fix.title}`);
  };
  const fixSafe = () => {
    if (!tools) return;
    let count = 0;
    const changed = onApply((definition) => {
      const result = tools.fixAll(definition);
      count = result.applied.length;
      return result.definition;
    });
    if (changed) announce(count === 1 ? 'Applied 1 fix' : `Applied ${String(count)} fixes`);
  };
  return (
    <div className={styles.problems}>
      {tools && safe > 0 && (
        <Button className={styles.fixAll} icon={<WandSparkles aria-hidden />} onClick={fixSafe}>
          Fix all safe issues ({safe})
        </Button>
      )}
      <ul className={styles.issues} aria-label="Definition issues">
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
    </div>
  );
}

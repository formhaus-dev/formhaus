import type { BindingRow } from '../bindings/rows';
import { byId, element } from './dom';

export type Coverage = 'yours' | 'reused' | 'kit' | 'missing';

export function coverageOf(row: BindingRow): Coverage {
  if (row.missing) return 'missing';
  if (row.via) return 'reused';
  return row.name ? 'yours' : 'kit';
}

export function isCovered(row: BindingRow): boolean {
  const state = coverageOf(row);
  return state === 'yours' || state === 'reused';
}

function legendItem(state: Coverage, text: string): HTMLElement {
  const item = element('span', 'legend-item');
  item.append(element('i', `dot cov-${state}`), document.createTextNode(text));
  return item;
}

export function renderCoverage(rows: BindingRow[], kitName: string): void {
  const counts: Record<Coverage, number> = { yours: 0, reused: 0, kit: 0, missing: 0 };
  for (const row of rows) counts[coverageOf(row)] += 1;
  const covered = counts.yours + counts.reused;
  const title = byId('coverageTitle');
  title.replaceChildren(element('strong', '', `${covered} of ${rows.length}`), document.createTextNode(' elements use your components'));
  const bar = byId('coverageBar');
  bar.replaceChildren(...(Object.keys(counts) as Coverage[])
    .filter((state) => counts[state] > 0)
    .map((state) => {
      const segment = element('span', `segment cov-${state}`);
      segment.style.flexGrow = String(counts[state]);
      return segment;
    }));
  const labels: Record<Coverage, string> = {
    yours: `${counts.yours} bound`,
    reused: `${counts.reused} reuse a bound one`,
    kit: `${counts.kit} from ${kitName}`,
    missing: `${counts.missing} missing`,
  };
  byId('coverageLegend').replaceChildren(...(Object.keys(counts) as Coverage[])
    .filter((state) => counts[state] > 0)
    .map((state) => legendItem(state, labels[state])));
}

import type { BindingRow } from '../bindings/rows';
import { byId, element } from './dom';

export type Coverage = 'yours' | 'reused' | 'kit' | 'missing';

export function coverageOf(row: BindingRow): Coverage {
  if (row.missing) return 'missing';
  if (row.via) return 'reused';
  return row.name ? 'yours' : 'kit';
}

function legendItem(state: Coverage, text: string): HTMLElement {
  const item = element('span', 'legend-item');
  item.append(element('i', `dot cov-${state}`), document.createTextNode(text));
  return item;
}

export function renderCoverage(rows: BindingRow[], kitName: string): void {
  const counts: Record<Coverage, number> = { yours: 0, reused: 0, kit: 0, missing: 0 };
  for (const row of rows) counts[coverageOf(row)] += 1;
  const title = byId('coverageTitle');
  const all = counts.yours === rows.length;
  title.replaceChildren(element('strong', '', all ? `All ${rows.length}` : `${counts.yours} of ${rows.length}`), document.createTextNode(' elements bound'));
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
    reused: `${counts.reused} use a substitute`,
    kit: `${counts.kit} from ${kitName}`,
    missing: `${counts.missing} missing`,
  };
  byId('coverageLegend').replaceChildren(...(Object.keys(counts) as Coverage[])
    .filter((state) => counts[state] > 0)
    .map((state) => legendItem(state, labels[state])));
}

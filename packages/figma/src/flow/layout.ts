import type { FlowGraph } from './graph';

export interface Point {
  x: number;
  y: number;
}

const COLUMN_GAP = 200;
const ROW_GAP = 120;
const LABEL_CHAR = 6.5;
const LABEL_ROOM = 112;

export function labelWidth(label: string): number {
  return Math.ceil(label.length * LABEL_CHAR) + 16;
}

function gapAfter(ids: string[], graph: FlowGraph): number {
  const labels = graph.edges.filter((edge) => edge.to && ids.includes(edge.from)).map((edge) => labelWidth(edge.label));
  return Math.max(COLUMN_GAP, ...labels.map((width) => width + LABEL_ROOM));
}

export function flowPositions(order: string[], graph: FlowGraph, sizes: Map<string, { width: number; height: number }>, origin: Point): Map<string, Point> {
  const columns = new Map<number, string[]>();
  for (const id of order) {
    const depth = graph.depth.get(id) ?? 0;
    columns.set(depth, [...(columns.get(depth) ?? []), id]);
  }
  const positions = new Map<string, Point>();
  let x = origin.x;
  for (const depth of [...columns.keys()].sort((left, right) => left - right)) {
    const ids = columns.get(depth)!;
    let y = origin.y;
    for (const id of ids) {
      positions.set(id, { x, y });
      y += (sizes.get(id)?.height ?? 0) + ROW_GAP;
    }
    x += Math.max(...ids.map((id) => sizes.get(id)?.width ?? 0)) + gapAfter(ids, graph);
  }
  return positions;
}

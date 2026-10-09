import { PLUGIN_NAMESPACE } from '../config';
import { solid, stack, text } from '../kits/primitives';
import type { KitTheme } from '../kits/kit';
import type { FlowEdge } from './graph';
import type { Point } from './layout';

export const FLOW_KEY = 'flowOf';
const ANCHOR = 64;
const SPREAD = 28;
const END_LENGTH = 72;
const BEND = 48;

interface Box {
  x: number;
  y: number;
  width: number;
  height: number;
}

export function edgePoints(source: Box, target: Box | null, outIndex: number, inIndex: number): Point[] {
  const start = { x: source.x + source.width, y: source.y + ANCHOR + outIndex * SPREAD };
  if (!target) return [start, { x: start.x + END_LENGTH, y: start.y }];
  const end = { x: target.x, y: target.y + ANCHOR + inIndex * SPREAD };
  const middle = end.x - start.x > BEND + 24 ? end.x - BEND : start.x + 24;
  return [start, { x: middle, y: start.y }, { x: middle, y: end.y }, end];
}

async function arrow(points: Point[], color: string): Promise<VectorNode> {
  const vector = figma.createVector();
  vector.name = 'Arrow';
  const origin = points[0];
  await vector.setVectorNetworkAsync({
    vertices: points.map((point, index) => ({
      x: point.x - origin.x,
      y: point.y - origin.y,
      strokeCap: index === points.length - 1 ? 'ARROW_LINES' : 'NONE',
    })),
    segments: points.slice(1).map((_, index) => ({ start: index, end: index + 1 })),
  });
  vector.strokes = solid(color);
  vector.strokeWeight = 1.5;
  vector.x += origin.x;
  vector.y += origin.y;
  return vector;
}

function tag(content: string, theme: KitTheme, at: Point): FrameNode {
  const node = stack('HORIZONTAL', 'Condition', { paddingLeft: 8, paddingRight: 8, paddingTop: 4, paddingBottom: 4 });
  node.fills = solid('#FFFFFF');
  node.strokes = solid('#D9D9DE');
  node.cornerRadius = 6;
  node.appendChild(text(content, { font: theme.fonts.regular, size: 11, color: theme.text }, 'Label'));
  node.x = at.x;
  node.y = at.y;
  return node;
}

function flowParent(frames: FrameNode[]): BaseNode & ChildrenMixin {
  const parents = new Set(frames.map((frame) => frame.parent));
  const [shared] = parents;
  return parents.size === 1 && shared ? shared : figma.currentPage;
}

function boxIn(frame: FrameNode, parent: BaseNode): Box {
  const local = frame.parent === parent;
  return { x: local ? frame.x : frame.absoluteTransform[0][2], y: local ? frame.y : frame.absoluteTransform[1][2], width: frame.width, height: frame.height };
}

async function edgeNodes(edges: FlowEdge[], boxes: Map<string, Box>, theme: KitTheme, nodes: SceneNode[]): Promise<void> {
  const incoming = new Map<string, number>();
  const outgoing = new Map<string, number>();
  for (const edge of edges) {
    const source = boxes.get(edge.from);
    const target = edge.to ? boxes.get(edge.to) ?? null : null;
    if (!source || (edge.to && !target) || (!edge.to && !edge.label)) continue;
    const out = outgoing.get(edge.from) ?? 0;
    const into = edge.to ? incoming.get(edge.to) ?? 0 : 0;
    outgoing.set(edge.from, out + 1);
    if (edge.to) incoming.set(edge.to, into + 1);
    const points = edgePoints(source, target, out, into);
    nodes.push(await arrow(points, theme.muted));
    const label = edge.to ? edge.label : [edge.label, 'End'].filter(Boolean).join(' → ');
    if (label) nodes.push(tag(label, theme, { x: points[0].x + 12, y: points[0].y - 26 }));
  }
}

export async function drawFlow(definitionId: string, edges: FlowEdge[], frames: Map<string, FrameNode>, theme: KitTheme): Promise<GroupNode | null> {
  const parent = flowParent([...frames.values()]);
  const boxes = new Map([...frames].map(([id, frame]) => [id, boxIn(frame, parent)]));
  const nodes: SceneNode[] = [];
  try {
    await edgeNodes(edges, boxes, theme, nodes);
  } catch (error) {
    for (const node of nodes) node.remove();
    throw error;
  }
  if (nodes.length === 0) return null;
  for (const node of nodes) parent.appendChild(node);
  const group = figma.group(nodes, parent);
  group.name = 'Flow';
  group.setSharedPluginData(PLUGIN_NAMESPACE, FLOW_KEY, definitionId);
  return group;
}

export function removeFlow(definitionId: string): void {
  for (const node of figma.currentPage.findAllWithCriteria({ types: ['GROUP'], sharedPluginData: { namespace: PLUGIN_NAMESPACE, keys: [FLOW_KEY] } })) {
    if (node.getSharedPluginData(PLUGIN_NAMESPACE, FLOW_KEY) === definitionId) node.remove();
  }
}

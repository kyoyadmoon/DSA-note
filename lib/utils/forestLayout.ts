// Forest layout for Union Find visualizations.
//
// Given a parent[] array (where parent[root] === root), lay out every
// component as an inverted tree with its root at the top, then arrange the
// trees side-by-side along x.
//
// We build a positioned-tree representation per component and run a
// contour-packing pass similar to lib/utils/treeLayout.ts so that:
//   1. Sibling subtrees never overlap (per-depth contour comparison).
//   2. A single child sits directly beneath its parent.
//   3. Two children straddle their parent symmetrically.
// Each component is then shifted so they are placed left-to-right with a
// fixed gap, optionally wrapping into a second row if total width exceeds
// MAX_FOREST_WIDTH.

export const FOREST_NODE_RADIUS = 22;
export const FOREST_LEVEL_HEIGHT = 78;
export const FOREST_TOP_PADDING = 24;
const HORIZONTAL_PADDING = FOREST_NODE_RADIUS + 16;
const MIN_SIBLING_SEPARATION = FOREST_NODE_RADIUS * 2 + 16;
const COMPONENT_GAP = FOREST_NODE_RADIUS * 2 + 28;
const MAX_FOREST_WIDTH = 1000;

export type ForestLayoutNode = {
  /** Element index (0..n-1). Doubles as a stable id. */
  id: number;
  x: number;
  y: number;
  parentId: number | null;
  /** True if this node is its component's root. */
  isRoot: boolean;
  /** Component root id — convenient for grouping. */
  rootId: number;
};

export type ForestLayoutEdge = {
  from: number; // child id
  to: number; // parent id
  fromX: number;
  fromY: number;
  toX: number;
  toY: number;
};

export type ForestLayout = {
  nodes: ForestLayoutNode[];
  edges: ForestLayoutEdge[];
  width: number;
  height: number;
};

type PositionedNode = {
  id: number;
  x: number;
  children: PositionedNode[];
};

type SubtreeLayout = {
  root: PositionedNode;
  /** Per-depth left-most x values (relative to the subtree's root x = 0). */
  minContour: number[];
  /** Per-depth right-most x values. */
  maxContour: number[];
  depth: number;
};

function shiftPositionedTree(node: PositionedNode, dx: number) {
  node.x += dx;
  for (const c of node.children) shiftPositionedTree(c, dx);
}

function shiftSubtree(layout: SubtreeLayout, dx: number): SubtreeLayout {
  shiftPositionedTree(layout.root, dx);
  return {
    ...layout,
    minContour: layout.minContour.map((v) => v + dx),
    maxContour: layout.maxContour.map((v) => v + dx),
  };
}

function requiredRightShift(
  placed: SubtreeLayout[],
  right: SubtreeLayout,
): number {
  const leftDepth = Math.max(...placed.map((layout) => layout.maxContour.length));
  const overlap = Math.min(leftDepth, right.minContour.length);
  let shift = Math.max(...placed.map((layout) => layout.root.x)) + MIN_SIBLING_SEPARATION;
  for (let d = 0; d < overlap; d++) {
    const leftMax = Math.max(
      ...placed
        .filter((layout) => d < layout.maxContour.length)
        .map((layout) => layout.maxContour[d]),
    );
    shift = Math.max(
      shift,
      leftMax + MIN_SIBLING_SEPARATION - right.minContour[d],
    );
  }
  return shift;
}

function buildSubtree(
  id: number,
  childrenByParent: Map<number, number[]>,
): SubtreeLayout {
  const childIds = childrenByParent.get(id) ?? [];
  const childLayouts = childIds.map((cid) => buildSubtree(cid, childrenByParent));

  if (childLayouts.length === 0) {
    return {
      root: { id, x: 0, children: [] },
      minContour: [0],
      maxContour: [0],
      depth: 1,
    };
  }

  if (childLayouts.length === 1) {
    const only = shiftSubtree(childLayouts[0], -childLayouts[0].root.x);
    // Place the single child directly beneath the parent.
    const positioned: PositionedNode = {
      id,
      x: 0,
      children: [only.root],
    };
    return {
      root: positioned,
      minContour: [0, ...only.minContour],
      maxContour: [0, ...only.maxContour],
      depth: only.depth + 1,
    };
  }

  // ≥ 2 children: position them side-by-side using contour packing, then
  // centre the parent over the whole span.
  const placed: SubtreeLayout[] = [shiftSubtree(childLayouts[0], -childLayouts[0].root.x)];
  for (let i = 1; i < childLayouts.length; i++) {
    const next = childLayouts[i];
    const targetX = requiredRightShift(placed, next);
    const shifted = shiftSubtree(next, targetX - next.root.x);
    placed.push(shifted);
  }

  // Centre the parent over the children.
  const firstX = placed[0].root.x;
  const lastX = placed[placed.length - 1].root.x;
  const centre = (firstX + lastX) / 2;
  for (let i = 0; i < placed.length; i++) {
    placed[i] = shiftSubtree(placed[i], -centre);
  }

  // Recompute combined contours.
  const childDepth = Math.max(...placed.map((p) => p.depth));
  const minContour = [0];
  const maxContour = [0];
  for (let d = 0; d < childDepth; d++) {
    let lo = Infinity;
    let hi = -Infinity;
    for (const p of placed) {
      if (d < p.minContour.length) {
        lo = Math.min(lo, p.minContour[d]);
        hi = Math.max(hi, p.maxContour[d]);
      }
    }
    minContour.push(lo);
    maxContour.push(hi);
  }

  return {
    root: { id, x: 0, children: placed.map((p) => p.root) },
    minContour,
    maxContour,
    depth: childDepth + 1,
  };
}

function collectPositioned(
  node: PositionedNode,
  parentId: number | null,
  rootId: number,
  depth: number,
  xOffset: number,
  yOffset: number,
  out: ForestLayoutNode[],
) {
  out.push({
    id: node.id,
    x: node.x + xOffset,
    y: depth * FOREST_LEVEL_HEIGHT + FOREST_NODE_RADIUS + yOffset,
    parentId,
    isRoot: parentId === null,
    rootId,
  });
  for (const c of node.children) {
    collectPositioned(c, node.id, rootId, depth + 1, xOffset, yOffset, out);
  }
}

export function calculateForestLayout(parents: number[]): ForestLayout {
  const n = parents.length;
  if (n === 0) return { nodes: [], edges: [], width: 0, height: 0 };

  // Group children by parent (excluding self-loops, which mark roots).
  const childrenByParent = new Map<number, number[]>();
  const roots: number[] = [];
  for (let i = 0; i < n; i++) {
    if (parents[i] === i) {
      roots.push(i);
    } else {
      const p = parents[i];
      if (!childrenByParent.has(p)) childrenByParent.set(p, []);
      childrenByParent.get(p)!.push(i);
    }
  }

  // Sort children for stable, predictable layouts (by index).
  for (const arr of childrenByParent.values()) arr.sort((a, b) => a - b);
  roots.sort((a, b) => a - b);

  // Lay out each component subtree.
  const subtrees = roots.map((r) => ({
    root: r,
    layout: buildSubtree(r, childrenByParent),
  }));

  // Place components left-to-right; wrap when exceeding MAX_FOREST_WIDTH.
  const nodes: ForestLayoutNode[] = [];
  let cursorX = HORIZONTAL_PADDING;
  let rowY = FOREST_TOP_PADDING;
  let rowMaxDepth = 0;
  let maxX = 0;

  function flushRowAdvanceY() {
    rowY += rowMaxDepth * FOREST_LEVEL_HEIGHT + FOREST_NODE_RADIUS * 2 + COMPONENT_GAP;
    rowMaxDepth = 0;
    cursorX = HORIZONTAL_PADDING;
  }

  for (const { root, layout } of subtrees) {
    const span = layout.maxContour.length
      ? Math.max(...layout.maxContour) - Math.min(...layout.minContour)
      : 0;
    const widthForComponent = span + FOREST_NODE_RADIUS * 2;

    if (
      cursorX + widthForComponent > MAX_FOREST_WIDTH &&
      cursorX > HORIZONTAL_PADDING
    ) {
      flushRowAdvanceY();
    }

    const minContourX = layout.minContour.length
      ? Math.min(...layout.minContour)
      : 0;
    const xOffset = cursorX - minContourX;

    collectPositioned(layout.root, null, root, 0, xOffset, rowY, nodes);

    rowMaxDepth = Math.max(rowMaxDepth, layout.depth);
    cursorX += widthForComponent + COMPONENT_GAP;
    maxX = Math.max(maxX, cursorX - COMPONENT_GAP + HORIZONTAL_PADDING);
  }

  // Build edges from final node positions.
  const posMap = new Map<number, ForestLayoutNode>();
  for (const node of nodes) posMap.set(node.id, node);

  const edges: ForestLayoutEdge[] = [];
  for (const node of nodes) {
    if (node.parentId === null) continue;
    const parent = posMap.get(node.parentId);
    if (!parent) continue;
    edges.push({
      from: node.id,
      to: parent.id,
      fromX: node.x,
      fromY: node.y,
      toX: parent.x,
      toY: parent.y,
    });
  }

  const totalDepth = rowMaxDepth;
  const height =
    rowY + totalDepth * FOREST_LEVEL_HEIGHT + FOREST_NODE_RADIUS * 2 + FOREST_TOP_PADDING;

  return {
    nodes,
    edges,
    width: Math.max(maxX, HORIZONTAL_PADDING * 2),
    height,
  };
}

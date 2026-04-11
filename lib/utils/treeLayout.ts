import type { TreeNode } from "@/lib/types/tree";

export const TREE_NODE_RADIUS = 24;
export const TREE_LEVEL_HEIGHT = 84;
export const TREE_TOP_PADDING = 20;

const HORIZONTAL_PADDING = TREE_NODE_RADIUS + 20;
const MIN_SIBLING_SEPARATION = TREE_NODE_RADIUS * 2 + 28;
const SINGLE_CHILD_OFFSET = TREE_NODE_RADIUS + 8;

export type TreeLayoutNode = {
  id: string;
  value: number;
  x: number;
  y: number;
  parentId: string | null;
};

export type TreeLayout = {
  nodes: TreeLayoutNode[];
  width: number;
  height: number;
};

type PositionedNode = {
  id: string;
  value: number;
  x: number;
  left: PositionedNode | null;
  right: PositionedNode | null;
};

type SubtreeLayout = {
  root: PositionedNode;
  minContour: number[];
  maxContour: number[];
  maxDepth: number;
};

function shiftPositionedTree(node: PositionedNode | null, deltaX: number) {
  if (!node) return;
  node.x += deltaX;
  shiftPositionedTree(node.left, deltaX);
  shiftPositionedTree(node.right, deltaX);
}

function shiftSubtree(layout: SubtreeLayout, deltaX: number): SubtreeLayout {
  shiftPositionedTree(layout.root, deltaX);
  return {
    ...layout,
    minContour: layout.minContour.map((value) => value + deltaX),
    maxContour: layout.maxContour.map((value) => value + deltaX),
  };
}

function requiredSeparation(left: SubtreeLayout, right: SubtreeLayout): number {
  const overlapDepth = Math.min(left.maxContour.length, right.minContour.length);
  let separation = MIN_SIBLING_SEPARATION;

  for (let depth = 0; depth < overlapDepth; depth++) {
    separation = Math.max(
      separation,
      left.maxContour[depth] + MIN_SIBLING_SEPARATION - right.minContour[depth],
    );
  }

  return separation;
}

function buildSubtree(node: TreeNode): SubtreeLayout {
  const left = node.left ? buildSubtree(node.left) : null;
  const right = node.right ? buildSubtree(node.right) : null;

  let shiftedLeft = left;
  let shiftedRight = right;

  if (left && right) {
    const separation = requiredSeparation(left, right);
    shiftedLeft = shiftSubtree(left, -separation / 2);
    shiftedRight = shiftSubtree(right, separation / 2);
  } else if (left) {
    shiftedLeft = shiftSubtree(left, -SINGLE_CHILD_OFFSET);
  } else if (right) {
    shiftedRight = shiftSubtree(right, SINGLE_CHILD_OFFSET);
  }

  const positioned: PositionedNode = {
    id: node.id,
    value: node.value,
    x: 0,
    left: shiftedLeft?.root ?? null,
    right: shiftedRight?.root ?? null,
  };

  const childDepth = Math.max(
    shiftedLeft?.minContour.length ?? 0,
    shiftedRight?.minContour.length ?? 0,
  );

  const minContour = [0];
  const maxContour = [0];

  for (let depth = 0; depth < childDepth; depth++) {
    const minCandidates: number[] = [];
    const maxCandidates: number[] = [];

    if (shiftedLeft && depth < shiftedLeft.minContour.length) {
      minCandidates.push(shiftedLeft.minContour[depth]);
      maxCandidates.push(shiftedLeft.maxContour[depth]);
    }

    if (shiftedRight && depth < shiftedRight.minContour.length) {
      minCandidates.push(shiftedRight.minContour[depth]);
      maxCandidates.push(shiftedRight.maxContour[depth]);
    }

    minContour.push(Math.min(...minCandidates));
    maxContour.push(Math.max(...maxCandidates));
  }

  return {
    root: positioned,
    minContour,
    maxContour,
    maxDepth: Math.max(shiftedLeft?.maxDepth ?? 0, shiftedRight?.maxDepth ?? 0) + 1,
  };
}

function collectNodes(
  node: PositionedNode | null,
  depth: number,
  parentId: string | null,
  xOffset: number,
  nodes: TreeLayoutNode[],
) {
  if (!node) return;

  nodes.push({
    id: node.id,
    value: node.value,
    x: node.x + xOffset,
    y: depth * TREE_LEVEL_HEIGHT + TREE_NODE_RADIUS + TREE_TOP_PADDING,
    parentId,
  });

  collectNodes(node.left, depth + 1, node.id, xOffset, nodes);
  collectNodes(node.right, depth + 1, node.id, xOffset, nodes);
}

export function calculateTreeLayout(root: TreeNode | null): TreeLayout {
  if (!root) return { nodes: [], width: 0, height: 0 };

  const subtree = buildSubtree(root);
  const minX = Math.min(...subtree.minContour);
  const maxX = Math.max(...subtree.maxContour);
  const xOffset = HORIZONTAL_PADDING - minX;
  const nodes: TreeLayoutNode[] = [];

  collectNodes(subtree.root, 0, null, xOffset, nodes);

  return {
    nodes,
    width: maxX - minX + HORIZONTAL_PADDING * 2,
    height:
      subtree.maxDepth * TREE_LEVEL_HEIGHT + TREE_NODE_RADIUS * 2 + TREE_TOP_PADDING,
  };
}

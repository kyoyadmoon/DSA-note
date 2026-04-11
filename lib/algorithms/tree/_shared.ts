import type {
  TreeNode,
  TreeNodeState,
  TreeStep,
} from "@/lib/types/tree";

// Shared helpers for tree algorithm step generators.
// Extracted from bstInsert's internal helpers so all four traversal algorithms
// (preorder / inorder / postorder / level-order) can reuse one implementation.

/**
 * Allocate a stable node id. Callers should create one allocator per step
 * generator invocation so node ids are deterministic per run.
 */
export function createIdAllocator(prefix: string): () => string {
  let counter = 0;
  return () => `${prefix}-${counter++}`;
}

/**
 * Build a BST from a list of values using the conventional
 * "insert each value from the root, left if smaller, right otherwise" rule.
 * Uses the supplied id allocator so all node ids are stable across the run.
 */
export function buildBSTFromValues(
  values: number[],
  allocId: () => string,
): TreeNode | null {
  let root: TreeNode | null = null;
  for (const v of values) {
    root = insertIntoBST(root, v, allocId);
  }
  return root;
}

function insertIntoBST(
  root: TreeNode | null,
  value: number,
  allocId: () => string,
): TreeNode {
  if (!root) return { id: allocId(), value, left: null, right: null };
  if (value < root.value) {
    root.left = insertIntoBST(root.left, value, allocId);
  } else {
    root.right = insertIntoBST(root.right, value, allocId);
  }
  return root;
}

/**
 * Deep-copy a tree. Each step's root must be an independent snapshot so
 * downstream components can safely hold references to old steps while newer
 * steps are generated.
 */
export function cloneTree(node: TreeNode | null): TreeNode | null {
  if (!node) return null;
  return {
    id: node.id,
    value: node.value,
    left: cloneTree(node.left),
    right: cloneTree(node.right),
  };
}

/**
 * Pre-order collection of all node ids in a tree. Returns ids in a
 * deterministic order so callers can iterate or snapshot them.
 */
export function collectNodeIds(node: TreeNode | null): string[] {
  if (!node) return [];
  return [node.id, ...collectNodeIds(node.left), ...collectNodeIds(node.right)];
}

/**
 * Build a nodeStates map that defaults every node in the tree to "idle",
 * then applies the given overrides. Unknown ids in overrides are silently
 * kept, so callers can pre-populate values even before a node is reachable.
 */
export function buildNodeStates(
  root: TreeNode | null,
  overrides: Record<string, TreeNodeState> = {},
): Record<string, TreeNodeState> {
  const states: Record<string, TreeNodeState> = {};
  for (const id of collectNodeIds(root)) {
    states[id] = overrides[id] ?? "idle";
  }
  for (const [id, state] of Object.entries(overrides)) {
    if (!(id in states)) states[id] = state;
  }
  return states;
}

/**
 * Convenience builder for a TreeStep snapshot. Deep-copies the root and
 * computes nodeStates from the overrides, so step generators stay terse.
 */
export function makeTreeStep(
  root: TreeNode | null,
  overrides: Record<string, TreeNodeState>,
  extras: Omit<TreeStep, "root" | "nodeStates">,
): TreeStep {
  return {
    root: cloneTree(root),
    nodeStates: buildNodeStates(root, overrides),
    ...extras,
  };
}

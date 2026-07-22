import type { UnionFindOp, UnionFindStep } from "@/lib/types/unionFind";

/**
 * Walk parent[] from x to its root, returning every visited index.
 * The first element is x, the last element is the root.
 */
export function findRootPath(parents: number[], x: number): number[] {
  const path: number[] = [x];
  let cur = x;
  while (parents[cur] !== cur) {
    cur = parents[cur];
    path.push(cur);
  }
  return path;
}

/** Run find() repeatedly until reaching the root. */
export function findRoot(parents: number[], x: number): number {
  let cur = x;
  while (parents[cur] !== cur) cur = parents[cur];
  return cur;
}

/**
 * Convenience builder that snapshots arrays so downstream callers can
 * mutate `parents` / `ranks` without affecting earlier steps in the
 * sequence.
 */
export function makeUFStep(
  fields: Omit<UnionFindStep, "parents" | "ranks" | "sizes"> & {
    parents: number[];
    ranks?: number[];
    sizes?: number[];
  },
): UnionFindStep {
  const { parents, ranks, sizes, highlightedNodes, activePath, ...rest } = fields;
  return {
    ...rest,
    parents: parents.slice(),
    ranks: ranks ? ranks.slice() : undefined,
    sizes: sizes ? sizes.slice() : undefined,
    highlightedNodes: highlightedNodes ? highlightedNodes.slice() : undefined,
    activePath: activePath ? activePath.slice() : undefined,
  };
}

/** Build the initial parents array (each element its own root). */
export function makeInitialParents(n: number): number[] {
  const parents = new Array<number>(n);
  for (let i = 0; i < n; i++) parents[i] = i;
  return parents;
}

/**
 * Pretty-print an op for narration text. Examples:
 *  - `union(4, 3)`
 *  - `find(7)`
 */
export function formatOp(op: UnionFindOp): string {
  if (op.kind === "union") return `union(${op.p}, ${op.q})`;
  return `find(${op.x})`;
}

/**
 * Group elements by their root (using the supplied parents array).
 * Returns a list of components, each as a sorted list of indices, with the
 * root listed first.
 */
export function listComponents(parents: number[]): number[][] {
  const groups = new Map<number, number[]>();
  for (let i = 0; i < parents.length; i++) {
    const r = findRoot(parents, i);
    if (!groups.has(r)) groups.set(r, []);
    groups.get(r)!.push(i);
  }
  const result: number[][] = [];
  for (const [root, members] of groups.entries()) {
    members.sort((a, b) => (a === root ? -1 : b === root ? 1 : a - b));
    result.push(members);
  }
  result.sort((a, b) => a[0] - b[0]);
  return result;
}

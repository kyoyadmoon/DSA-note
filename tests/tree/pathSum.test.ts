import { describe, expect, it } from "vitest";
import { bstInsert } from "@/lib/algorithms/tree/bstInsert";
import {
  hasPathSum,
  pathSumSource,
  pathSumSteps,
} from "@/lib/algorithms/tree/pathSum";
import type { TreeNode } from "@/lib/types/tree";

function referenceHasPathSum(root: TreeNode | null, target: number): boolean {
  if (!root) return false;

  const remaining = target - root.value;
  if (!root.left && !root.right) return remaining === 0;

  return (
    referenceHasPathSum(root.left, remaining) ||
    referenceHasPathSum(root.right, remaining)
  );
}

function collectIds(node: TreeNode | null): string[] {
  if (!node) return [];
  return [node.id, ...collectIds(node.left), ...collectIds(node.right)];
}

function collectValues(node: TreeNode | null): number[] {
  if (!node) return [];
  return [node.value, ...collectValues(node.left), ...collectValues(node.right)];
}

function sortedValues(node: TreeNode | null): number[] {
  return collectValues(node).sort((a, b) => a - b);
}

describe("hasPathSum", () => {
  it("returns false for an empty tree", () => {
    expect(hasPathSum(null, 10)).toBe(false);
  });

  it("returns true for a single matching node", () => {
    const root = bstInsert([7]);
    expect(hasPathSum(root, 7)).toBe(true);
  });

  it("returns false for a single non-matching node", () => {
    const root = bstInsert([7]);
    expect(hasPathSum(root, 8)).toBe(false);
  });

  it("matches a reference DFS for the classic LC 112 sample values under this repo's BST builder", () => {
    const values = [5, 4, 8, 11, 13, 4, 7, 2, 1];
    const target = 22;
    const root = bstInsert(values);

    expect(hasPathSum(root, target)).toBe(referenceHasPathSum(root, target));
  });

  it("handles an explicit false case", () => {
    const values = [10, 5, 15, 3, 7, 12, 18, 1];
    const target = 999;
    const root = bstInsert(values);

    expect(hasPathSum(root, target)).toBe(false);
    expect(hasPathSum(root, target)).toBe(referenceHasPathSum(root, target));
  });

  it("matches a reference DFS for 200 random trees and targets", () => {
    for (let trial = 0; trial < 200; trial++) {
      const length = Math.floor(Math.random() * 18);
      const values = Array.from({ length }, () => Math.floor(Math.random() * 41) - 20);
      const target = Math.floor(Math.random() * 161) - 40;
      const root = bstInsert(values);

      expect(hasPathSum(root, target)).toBe(referenceHasPathSum(root, target));
    }
  });
});

describe("pathSumSteps", () => {
  it("keeps the multiset of node values constant across every step", () => {
    const values = [10, 5, 15, 3, 7, 12, 18, 1];
    const steps = pathSumSteps(values, 19);
    const baseline = sortedValues(steps[0].root);

    for (const step of steps) {
      expect(sortedValues(step.root)).toEqual(baseline);
    }
  });

  it("keeps node ids stable across the entire sequence", () => {
    const values = [10, 5, 15, 3, 7, 12, 18, 1];
    const steps = pathSumSteps(values, 19);
    const baseline = collectIds(steps[0].root);

    for (const step of steps) {
      expect(collectIds(step.root)).toEqual(baseline);
    }
  });

  it("ends with phase done and includes the boolean result in detail", () => {
    const values = [10, 5, 15, 3, 7, 12, 18, 1];
    const target = 19;
    const steps = pathSumSteps(values, target);
    const finalStep = steps[steps.length - 1];
    const root = bstInsert(values);

    expect(finalStep.phase).toBe("done");
    expect(finalStep.detail).toContain(String(hasPathSum(root, target)));
  });

  it("keeps every codeLine within pathSumSource", () => {
    const steps = pathSumSteps([10, 5, 15, 3, 7], 18);
    const totalLines = pathSumSource.split("\n").length;

    for (const step of steps) {
      expect(step.codeLine).toBeGreaterThanOrEqual(1);
      expect(step.codeLine).toBeLessThanOrEqual(totalLines);
    }
  });
});

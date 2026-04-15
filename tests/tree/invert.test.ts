import { describe, expect, it } from "vitest";
import {
  invertTree,
  invertTreeSource,
  invertTreeSteps,
} from "@/lib/algorithms/tree/invert";
import {
  buildBSTFromValues,
  cloneTree,
  collectNodeIds,
  createIdAllocator,
} from "@/lib/algorithms/tree/_shared";
import type { TreeNode } from "@/lib/types/tree";

function buildFromValues(values: number[], prefix = "ref"): TreeNode | null {
  return buildBSTFromValues(values, createIdAllocator(prefix));
}

function manualInvert(node: TreeNode | null): TreeNode | null {
  const working = cloneTree(node);

  function walk(current: TreeNode | null): void {
    if (current === null) return;
    walk(current.left);
    walk(current.right);
    const temp = current.left;
    current.left = current.right;
    current.right = temp;
  }

  walk(working);
  return working;
}

function preorder(node: TreeNode | null): number[] {
  if (node === null) return [];
  return [node.value, ...preorder(node.left), ...preorder(node.right)];
}

function inorder(node: TreeNode | null): number[] {
  if (node === null) return [];
  return [...inorder(node.left), node.value, ...inorder(node.right)];
}

function normalize(node: TreeNode | null): unknown {
  if (node === null) return null;
  return {
    value: node.value,
    left: normalize(node.left),
    right: normalize(node.right),
  };
}

function sortedValues(node: TreeNode | null): number[] {
  return preorder(node).toSorted((a, b) => a - b);
}

describe("invertTree", () => {
  it("returns null for an empty tree", () => {
    expect(invertTree(null)).toBeNull();
  });

  it("handles a single-node tree", () => {
    const root = buildFromValues([42]);
    expect(preorder(invertTree(root))).toEqual([42]);
    expect(inorder(invertTree(root))).toEqual([42]);
  });

  it("handles a left-skewed tree", () => {
    const root = buildFromValues([5, 4, 3, 2, 1]);
    const expected = manualInvert(root);
    const actual = invertTree(root);
    expect(preorder(actual)).toEqual(preorder(expected));
    expect(inorder(actual)).toEqual(inorder(expected));
  });

  it("handles a right-skewed tree", () => {
    const root = buildFromValues([1, 2, 3, 4, 5]);
    const expected = manualInvert(root);
    const actual = invertTree(root);
    expect(preorder(actual)).toEqual(preorder(expected));
    expect(inorder(actual)).toEqual(inorder(expected));
  });

  it("handles a balanced tree", () => {
    const root = buildFromValues([50, 30, 70, 20, 40, 60, 80]);
    const expected = manualInvert(root);
    const actual = invertTree(root);
    expect(preorder(actual)).toEqual(preorder(expected));
    expect(inorder(actual)).toEqual(inorder(expected));
  });

  it("matches a brute-force reference on 200 random trees", () => {
    for (let trial = 0; trial < 200; trial++) {
      const length = Math.floor(Math.random() * 20);
      const values = Array.from(
        { length },
        () => Math.floor(Math.random() * 200) - 100,
      );
      const root = buildFromValues(values, `rand-${trial}`);
      const expected = manualInvert(root);
      const actual = invertTree(root);
      expect(preorder(actual)).toEqual(preorder(expected));
      expect(inorder(actual)).toEqual(inorder(expected));
    }
  });
});

describe("invertTreeSteps", () => {
  it("keeps the node-value multiset constant across all steps", () => {
    const values = [50, 30, 70, 20, 40, 60, 80];
    const steps = invertTreeSteps(values);
    const expected = [...values].toSorted((a, b) => a - b);

    for (const step of steps) {
      expect(sortedValues(step.root)).toEqual(expected);
    }
  });

  it("ends with a tree structurally equal to invertTree(original)", () => {
    const values = [50, 30, 70, 20, 40, 60, 80];
    const original = buildFromValues(values, "shape");
    const steps = invertTreeSteps(values);
    const finalRoot = steps[steps.length - 1].root;

    expect(normalize(finalRoot)).toEqual(normalize(invertTree(original)));
  });

  it("keeps stable ids from the first snapshot to the final snapshot", () => {
    const steps = invertTreeSteps([50, 30, 70, 20, 40, 60, 80]);
    const initialIds = new Set(collectNodeIds(steps[0].root));
    const finalIds = new Set(collectNodeIds(steps[steps.length - 1].root));

    expect(finalIds).toEqual(initialIds);
  });

  it("keeps the same id set throughout the whole sequence", () => {
    const steps = invertTreeSteps([50, 30, 70, 20, 40, 60, 80]);
    const expectedIds = new Set(collectNodeIds(steps[0].root));

    for (const step of steps) {
      expect(new Set(collectNodeIds(step.root))).toEqual(expectedIds);
    }
  });

  it("keeps every codeLine within invertTreeSource", () => {
    const steps = invertTreeSteps([50, 30, 70, 20, 40]);
    const totalLines = invertTreeSource.split("\n").length;

    for (const step of steps) {
      expect(step.codeLine).toBeGreaterThanOrEqual(1);
      expect(step.codeLine).toBeLessThanOrEqual(totalLines);
    }
  });

  it("includes swap steps before showing the mutated shape", () => {
    const steps = invertTreeSteps([50, 30, 70]);
    expect(steps.some((step) => step.nodeStates[steps[0].root!.id] === "swap")).toBe(
      true,
    );
    expect(steps[steps.length - 1].phase).toBe("done");
  });

  it("handles empty input", () => {
    const steps = invertTreeSteps([]);
    expect(steps[0].phase).toBe("idle");
    expect(steps[steps.length - 1].phase).toBe("done");
    expect(steps[steps.length - 1].root).toBeNull();
  });
});

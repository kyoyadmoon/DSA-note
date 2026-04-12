import { describe, expect, it } from "vitest";
import {
  levelOrder,
  levelOrderSource,
  levelOrderSteps,
} from "@/lib/algorithms/tree/levelOrder";
import type { TreeNode } from "@/lib/types/tree";

function buildFromValues(values: number[]): TreeNode | null {
  let root: TreeNode | null = null;
  let nextId = 0;

  function insert(node: TreeNode | null, value: number): TreeNode {
    if (!node) {
      return { id: `ref-${nextId++}`, value, left: null, right: null };
    }
    if (value < node.value) node.left = insert(node.left, value);
    else node.right = insert(node.right, value);
    return node;
  }

  for (const value of values) {
    root = insert(root, value);
  }

  return root;
}

function collectIds(node: TreeNode | null): string[] {
  if (!node) return [];
  return [node.id, ...collectIds(node.left), ...collectIds(node.right)];
}

function buildDepthMap(root: TreeNode | null): Map<number, number> {
  const depthByValue = new Map<number, number>();

  function walk(node: TreeNode | null, depth: number): void {
    if (!node) return;
    depthByValue.set(node.value, depth);
    walk(node.left, depth + 1);
    walk(node.right, depth + 1);
  }

  walk(root, 0);
  return depthByValue;
}

describe("levelOrder", () => {
  it("returns [] for null root", () => {
    expect(levelOrder(null)).toEqual([]);
  });

  it("handles single node", () => {
    const root = buildFromValues([42]);
    expect(levelOrder(root)).toEqual([42]);
  });

  it("handles left-skewed tree", () => {
    const root = buildFromValues([5, 4, 3, 2, 1]);
    expect(levelOrder(root)).toEqual([5, 4, 3, 2, 1]);
  });

  it("handles right-skewed tree", () => {
    const root = buildFromValues([1, 2, 3, 4, 5]);
    expect(levelOrder(root)).toEqual([1, 2, 3, 4, 5]);
  });

  it("visits a balanced tree in breadth-first order", () => {
    const root = buildFromValues([50, 30, 70, 20, 40, 60, 80]);
    expect(levelOrder(root)).toEqual([50, 30, 70, 20, 40, 60, 80]);
  });

  it("emits depths in non-decreasing order", () => {
    const values = [50, 30, 70, 20, 40, 60, 80];
    const root = buildFromValues(values);
    const depthByValue = buildDepthMap(root);
    const depths = levelOrder(root).map((value) => depthByValue.get(value)!);

    for (let i = 1; i < depths.length; i++) {
      expect(depths[i - 1]).toBeLessThanOrEqual(depths[i]);
    }
  });
});

describe("levelOrderSteps", () => {
  it("starts with phase idle and ends with phase done", () => {
    const steps = levelOrderSteps([50, 30, 70]);
    expect(steps[0].phase).toBe("idle");
    expect(steps[steps.length - 1].phase).toBe("done");
  });

  it("every step has non-empty title and detail", () => {
    const steps = levelOrderSteps([50, 30, 70, 20, 40]);
    for (const step of steps) {
      expect(step.title).toBeTruthy();
      expect(step.detail).toBeTruthy();
    }
  });

  it("keeps a stable node id set across all steps", () => {
    const steps = levelOrderSteps([50, 30, 70, 20, 40, 60, 80]);
    const finalIds = new Set(collectIds(steps[steps.length - 1].root));

    for (const step of steps) {
      const ids = new Set(collectIds(step.root));
      expect(ids).toEqual(finalIds);
    }
  });

  it("implies the same final output as levelOrder(root)", () => {
    const values = [50, 30, 70, 20, 40, 60, 80];
    const steps = levelOrderSteps(values);
    const root = buildFromValues(values);
    const output = steps
      .filter((step) => step.title.startsWith("輸出 "))
      .map((step) => Number(step.title.replace("輸出 ", "")));

    expect(output).toEqual(levelOrder(root));
  });

  it("keeps every codeLine within the source range", () => {
    const steps = levelOrderSteps([50, 30, 70, 20, 40]);
    const totalLines = levelOrderSource.split("\n").length;

    for (const step of steps) {
      expect(step.codeLine).toBeGreaterThanOrEqual(1);
      expect(step.codeLine).toBeLessThanOrEqual(totalLines);
    }
  });

  it("includes queue state in at least one detail line", () => {
    const steps = levelOrderSteps([50, 30, 70, 20, 40]);
    expect(
      steps.some((step) => step.detail.toLowerCase().includes("queue")),
    ).toBe(true);
  });
});

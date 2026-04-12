import { describe, expect, it } from "vitest";
import {
  maxDepth,
  maxDepthSteps,
  maxDepthSource,
} from "@/lib/algorithms/tree/maxDepth";
import type { TreeNode } from "@/lib/types/tree";

// Helpers ────────────────────────────────────────────────────

function buildFromValues(values: number[]): TreeNode | null {
  let root: TreeNode | null = null;
  let nextId = 0;
  function insert(node: TreeNode | null, value: number): TreeNode {
    if (!node)
      return { id: `ref-${nextId++}`, value, left: null, right: null };
    if (value < node.value) node.left = insert(node.left, value);
    else node.right = insert(node.right, value);
    return node;
  }
  for (const v of values) root = insert(root, v);
  return root;
}

function collectIds(node: TreeNode | null): string[] {
  if (!node) return [];
  return [node.id, ...collectIds(node.left), ...collectIds(node.right)];
}

// maxDepth (pure) ────────────────────────────────────────────

describe("maxDepth", () => {
  it("returns 0 for null root", () => {
    expect(maxDepth(null)).toBe(0);
  });

  it("returns 1 for single node", () => {
    const root = buildFromValues([42]);
    expect(maxDepth(root)).toBe(1);
  });

  it("handles left-skewed tree", () => {
    // 5 -> 4 -> 3 -> 2 -> 1 (all left children)
    const root = buildFromValues([5, 4, 3, 2, 1]);
    expect(maxDepth(root)).toBe(5);
  });

  it("handles right-skewed tree", () => {
    // 1 -> 2 -> 3 -> 4 -> 5 (all right children)
    const root = buildFromValues([1, 2, 3, 4, 5]);
    expect(maxDepth(root)).toBe(5);
  });

  it("handles balanced BST with known depth", () => {
    // [50, 30, 70, 20, 40, 60, 80] builds a perfect 3-level BST
    const root = buildFromValues([50, 30, 70, 20, 40, 60, 80]);
    expect(maxDepth(root)).toBe(3);
  });

  it("handles asymmetric tree", () => {
    // [50, 30, 70, 20, 10] -> right side depth 2, left side depth 4
    const root = buildFromValues([50, 30, 70, 20, 10]);
    expect(maxDepth(root)).toBe(4);
  });

  it("survives 200 random inputs (matches reference)", () => {
    function referenceDepth(node: TreeNode | null): number {
      if (!node) return 0;
      return 1 + Math.max(referenceDepth(node.left), referenceDepth(node.right));
    }
    for (let trial = 0; trial < 200; trial++) {
      const len = Math.floor(Math.random() * 20) + 1;
      const values = Array.from(
        { length: len },
        () => Math.floor(Math.random() * 200) - 100,
      );
      const root = buildFromValues(values);
      expect(maxDepth(root)).toBe(referenceDepth(root));
    }
  });
});

// maxDepthSteps ──────────────────────────────────────────────

describe("maxDepthSteps", () => {
  it("starts with phase idle", () => {
    const steps = maxDepthSteps([50, 30, 70]);
    expect(steps[0].phase).toBe("idle");
  });

  it("ends with phase done", () => {
    const steps = maxDepthSteps([50, 30, 70]);
    expect(steps[steps.length - 1].phase).toBe("done");
  });

  it("every step has non-empty title and detail", () => {
    const steps = maxDepthSteps([50, 30, 70, 20, 40]);
    for (const step of steps) {
      expect(step.title).toBeTruthy();
      expect(step.detail).toBeTruthy();
      expect(typeof step.title).toBe("string");
      expect(typeof step.detail).toBe("string");
    }
  });

  it("every codeLine is within the source line range", () => {
    const steps = maxDepthSteps([50, 30, 70, 20, 40]);
    const totalLines = maxDepthSource.split("\n").length;
    for (const step of steps) {
      expect(step.codeLine).toBeGreaterThanOrEqual(1);
      expect(step.codeLine).toBeLessThanOrEqual(totalLines);
    }
  });

  it("node ids are stable across all steps", () => {
    const steps = maxDepthSteps([50, 30, 70, 20, 40, 60, 80]);
    const finalIds = new Set(
      collectIds(steps[steps.length - 1].root),
    );
    for (const step of steps) {
      const ids = new Set(collectIds(step.root));
      for (const id of ids) expect(finalIds.has(id)).toBe(true);
    }
  });

  it("final step detail contains the correct depth number", () => {
    const values = [50, 30, 70, 20, 40, 60, 80];
    const steps = maxDepthSteps(values);
    const root = buildFromValues(values);
    const expectedDepth = maxDepth(root);
    const last = steps[steps.length - 1];
    expect(last.detail).toContain(String(expectedDepth));
  });

  it("at least one step detail contains max (showing computation)", () => {
    const steps = maxDepthSteps([50, 30, 70, 20, 40]);
    const hasMax = steps.some((s) => s.detail.includes("max"));
    expect(hasMax).toBe(true);
  });

  it("handles empty input", () => {
    const steps = maxDepthSteps([]);
    expect(steps[0].phase).toBe("idle");
    expect(steps[steps.length - 1].phase).toBe("done");
    expect(steps[steps.length - 1].root).toBeNull();
  });

  it("handles single element input", () => {
    const steps = maxDepthSteps([42]);
    expect(steps[0].phase).toBe("idle");
    expect(steps[steps.length - 1].phase).toBe("done");
    expect(steps[steps.length - 1].detail).toContain("1");
  });

  it("operates without throwing on 100 random inputs", () => {
    for (let trial = 0; trial < 100; trial++) {
      const len = Math.floor(Math.random() * 15) + 1;
      const values = Array.from(
        { length: len },
        () => Math.floor(Math.random() * 200) - 100,
      );
      const steps = maxDepthSteps(values);
      expect(steps[0].phase).toBe("idle");
      expect(steps[steps.length - 1].phase).toBe("done");
    }
  });
});

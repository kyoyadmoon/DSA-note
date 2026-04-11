import { describe, expect, it } from "vitest";
import {
  preorder,
  preorderSteps,
  preorderSource,
} from "@/lib/algorithms/tree/preorder";
import type { TreeNode } from "@/lib/types/tree";

// Helpers ────────────────────────────────────────────────────

function buildFromValues(values: number[]): TreeNode | null {
  // Mirror the BST used internally by preorderSteps so tests can
  // construct an expected tree without depending on _shared.
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

// preorder (pure) ────────────────────────────────────────────

describe("preorder", () => {
  it("returns [] for null root", () => {
    expect(preorder(null)).toEqual([]);
  });

  it("handles single node", () => {
    const root = buildFromValues([42]);
    expect(preorder(root)).toEqual([42]);
  });

  it("visits root before children", () => {
    // Tree from [5, 3, 7]: root=5, left=3, right=7
    const root = buildFromValues([5, 3, 7]);
    expect(preorder(root)).toEqual([5, 3, 7]);
  });

  it("handles right-only chain (sorted input)", () => {
    const root = buildFromValues([1, 2, 3, 4, 5]);
    expect(preorder(root)).toEqual([1, 2, 3, 4, 5]);
  });

  it("handles left-only chain (reverse-sorted input)", () => {
    const root = buildFromValues([5, 4, 3, 2, 1]);
    expect(preorder(root)).toEqual([5, 4, 3, 2, 1]);
  });

  it("handles a balanced BST with known order", () => {
    // Insertion order [50, 30, 70, 20, 40, 60, 80] builds a balanced BST.
    // Preorder: 50, 30, 20, 40, 70, 60, 80
    const root = buildFromValues([50, 30, 70, 20, 40, 60, 80]);
    expect(preorder(root)).toEqual([50, 30, 20, 40, 70, 60, 80]);
  });

  it("survives 200 random inputs (matches naive recursive reference)", () => {
    function referencePreorder(node: TreeNode | null): number[] {
      if (!node) return [];
      return [
        node.value,
        ...referencePreorder(node.left),
        ...referencePreorder(node.right),
      ];
    }
    for (let trial = 0; trial < 200; trial++) {
      const len = Math.floor(Math.random() * 20) + 1;
      const values = Array.from(
        { length: len },
        () => Math.floor(Math.random() * 200) - 100,
      );
      const root = buildFromValues(values);
      expect(preorder(root)).toEqual(referencePreorder(root));
    }
  });
});

// preorderSteps ──────────────────────────────────────────────

describe("preorderSteps", () => {
  it("starts with phase idle", () => {
    const steps = preorderSteps([50, 30, 70]);
    expect(steps[0].phase).toBe("idle");
  });

  it("ends with phase done", () => {
    const steps = preorderSteps([50, 30, 70]);
    expect(steps[steps.length - 1].phase).toBe("done");
  });

  it("every step has non-empty title and detail", () => {
    const steps = preorderSteps([50, 30, 70, 20, 40]);
    for (const step of steps) {
      expect(step.title).toBeTruthy();
      expect(step.detail).toBeTruthy();
      expect(typeof step.title).toBe("string");
      expect(typeof step.detail).toBe("string");
    }
  });

  it("every codeLine is within the source line range", () => {
    const steps = preorderSteps([50, 30, 70, 20, 40]);
    const totalLines = preorderSource.split("\n").length;
    for (const step of steps) {
      expect(step.codeLine).toBeGreaterThanOrEqual(1);
      expect(step.codeLine).toBeLessThanOrEqual(totalLines);
    }
  });

  it("node ids are stable across all steps", () => {
    const steps = preorderSteps([50, 30, 70, 20, 40, 60, 80]);
    const finalIds = new Set(
      collectIds(steps[steps.length - 1].root),
    );
    for (const step of steps) {
      const ids = new Set(collectIds(step.root));
      for (const id of ids) expect(finalIds.has(id)).toBe(true);
    }
  });

  it("visit phase count equals node count (2 steps per node)", () => {
    // Each visited node emits 2 "visit" steps (descend + output).
    const input = [50, 30, 70, 20, 40];
    const steps = preorderSteps(input);
    const visitSteps = steps.filter((s) => s.phase === "visit");
    expect(visitSteps.length).toBe(input.length * 2);
  });

  it("final step's detail contains the full output sequence", () => {
    // Preorder of BST built from [50,30,70,20,40,60,80] is 50,30,20,40,70,60,80.
    const steps = preorderSteps([50, 30, 70, 20, 40, 60, 80]);
    const last = steps[steps.length - 1];
    expect(last.detail).toContain("50, 30, 20, 40, 70, 60, 80");
  });

  it("handles empty input", () => {
    const steps = preorderSteps([]);
    expect(steps[0].phase).toBe("idle");
    expect(steps[steps.length - 1].phase).toBe("done");
    expect(steps[steps.length - 1].root).toBeNull();
  });

  it("handles single element input", () => {
    const steps = preorderSteps([42]);
    expect(steps[0].phase).toBe("idle");
    expect(steps[steps.length - 1].phase).toBe("done");
    const visitSteps = steps.filter((s) => s.phase === "visit");
    expect(visitSteps.length).toBe(2);
  });

  it("operates without throwing on 100 random inputs", () => {
    for (let trial = 0; trial < 100; trial++) {
      const len = Math.floor(Math.random() * 15) + 1;
      const values = Array.from(
        { length: len },
        () => Math.floor(Math.random() * 200) - 100,
      );
      const steps = preorderSteps(values);
      expect(steps[0].phase).toBe("idle");
      expect(steps[steps.length - 1].phase).toBe("done");
    }
  });
});

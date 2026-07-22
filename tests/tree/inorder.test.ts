import { describe, expect, it } from "vitest";
import {
  inorder,
  inorderSteps,
  inorderSource,
} from "@/lib/algorithms/tree/inorder";
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

function parseOutputSequence(detail: string): number[] {
  const match = detail.match(/\[([^\]]*)\]/);
  if (!match) return [];
  const content = match[1].trim();
  if (!content) return [];
  return content.split(",").map((value) => Number(value.trim()));
}

// inorder (pure) ─────────────────────────────────────────────

describe("inorder", () => {
  it("returns [] for null root", () => {
    expect(inorder(null)).toEqual([]);
  });

  it("handles single node", () => {
    const root = buildFromValues([42]);
    expect(inorder(root)).toEqual([42]);
  });

  it("handles left-only chain", () => {
    const root = buildFromValues([5, 4, 3, 2, 1]);
    expect(inorder(root)).toEqual([1, 2, 3, 4, 5]);
  });

  it("handles right-only chain", () => {
    const root = buildFromValues([1, 2, 3, 4, 5]);
    expect(inorder(root)).toEqual([1, 2, 3, 4, 5]);
  });

  it("handles a balanced BST", () => {
    const root = buildFromValues([50, 30, 70, 20, 40, 60, 80]);
    expect(inorder(root)).toEqual([20, 30, 40, 50, 60, 70, 80]);
  });

  it("matches a known general binary-tree sequence", () => {
    const root: TreeNode = {
      id: "root",
      value: 6,
      left: {
        id: "left",
        value: 3,
        left: { id: "left-left", value: 1, left: null, right: null },
        right: { id: "left-right", value: 4, left: null, right: null },
      },
      right: {
        id: "right",
        value: 10,
        left: {
          id: "right-left",
          value: 8,
          left: { id: "right-left-left", value: 7, left: null, right: null },
          right: null,
        },
        right: {
          id: "right-right",
          value: 14,
          left: { id: "right-right-left", value: 13, left: null, right: null },
          right: null,
        },
      },
    };
    expect(inorder(root)).toEqual([1, 3, 4, 6, 7, 8, 10, 13, 14]);
  });

  it("returns sorted output for a BST built from values", () => {
    const values = [50, 30, 70, 20, 40, 60, 80, 65];
    const root = buildFromValues(values);
    expect(inorder(root)).toEqual([...values].sort((a, b) => a - b));
  });
});

// inorderSteps ───────────────────────────────────────────────

describe("inorderSteps", () => {
  it("starts with phase idle", () => {
    const steps = inorderSteps([50, 30, 70]);
    expect(steps[0].phase).toBe("idle");
  });

  it("ends with phase done", () => {
    const steps = inorderSteps([50, 30, 70]);
    expect(steps[steps.length - 1].phase).toBe("done");
  });

  it("every step has non-empty title and detail", () => {
    const steps = inorderSteps([50, 30, 70, 20, 40]);
    for (const step of steps) {
      expect(step.title).toBeTruthy();
      expect(step.detail).toBeTruthy();
      expect(typeof step.title).toBe("string");
      expect(typeof step.detail).toBe("string");
    }
  });

  it("keeps the same node id set across all steps", () => {
    const steps = inorderSteps([50, 30, 70, 20, 40, 60, 80]);
    const finalIds = new Set(collectIds(steps[steps.length - 1].root));
    for (const step of steps) {
      expect(new Set(collectIds(step.root))).toEqual(finalIds);
    }
  });

  it("final step's output matches inorder(root)", () => {
    const values = [50, 30, 70, 20, 40, 60, 80];
    const steps = inorderSteps(values);
    const root = buildFromValues(values);
    const last = steps[steps.length - 1];
    expect(parseOutputSequence(last.detail)).toEqual(inorder(root));
  });

  it("every codeLine is within the source line range", () => {
    const steps = inorderSteps([50, 30, 70, 20, 40]);
    const totalLines = inorderSource.split("\n").length;
    for (const step of steps) {
      expect(step.codeLine).toBeGreaterThanOrEqual(1);
      expect(step.codeLine).toBeLessThanOrEqual(totalLines);
    }
  });

  it("grows linearly with the number of nodes", () => {
    for (const input of [
      [42],
      [50, 30, 70],
      [50, 30, 70, 20, 40, 60, 80],
    ]) {
      const steps = inorderSteps(input);
      expect(steps.length).toBeGreaterThanOrEqual(input.length * 2 + 2);
      expect(steps.length).toBeLessThanOrEqual(input.length * 5 + 2);
    }
  });

  it("handles empty input", () => {
    const steps = inorderSteps([]);
    expect(steps[0].phase).toBe("idle");
    expect(steps[steps.length - 1].phase).toBe("done");
    expect(steps[steps.length - 1].root).toBeNull();
    expect(parseOutputSequence(steps[steps.length - 1].detail)).toEqual([]);
  });
});


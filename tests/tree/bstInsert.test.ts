import { describe, expect, it } from "vitest";
import {
  bstInsert,
  bstInsertSteps,
} from "@/lib/algorithms/tree/bstInsert";
import type { TreeNode } from "@/lib/types/tree";

// ── helpers ────────────────────────────────────────────────────

function inorder(node: TreeNode | null): number[] {
  if (!node) return [];
  return [...inorder(node.left), node.value, ...inorder(node.right)];
}

function collectIds(node: TreeNode | null): string[] {
  if (!node) return [];
  return [node.id, ...collectIds(node.left), ...collectIds(node.right)];
}

function treeSize(node: TreeNode | null): number {
  if (!node) return 0;
  return 1 + treeSize(node.left) + treeSize(node.right);
}

// ── bstInsert (pure function) ──────────────────────────────────

describe("bstInsert", () => {
  it("returns null for empty input", () => {
    expect(bstInsert([])).toBeNull();
  });

  it("creates a single root node", () => {
    const root = bstInsert([42]);
    expect(root).not.toBeNull();
    expect(root!.value).toBe(42);
    expect(root!.left).toBeNull();
    expect(root!.right).toBeNull();
  });

  it("maintains BST property (inorder is sorted)", () => {
    const root = bstInsert([50, 30, 70, 20, 40, 60, 80]);
    expect(inorder(root)).toEqual([20, 30, 40, 50, 60, 70, 80]);
  });

  it("handles duplicate values", () => {
    const root = bstInsert([5, 3, 5, 3]);
    const values = inorder(root);
    expect(values).toEqual([3, 3, 5, 5]);
    expect(treeSize(root)).toBe(4);
  });

  it("handles already-sorted input (degenerates to chain)", () => {
    const root = bstInsert([1, 2, 3, 4, 5]);
    expect(inorder(root)).toEqual([1, 2, 3, 4, 5]);
    // Should be a right-only chain
    let current = root;
    let depth = 0;
    while (current) {
      expect(current.left).toBeNull();
      current = current.right;
      depth++;
    }
    expect(depth).toBe(5);
  });

  it("handles reverse-sorted input (left-only chain)", () => {
    const root = bstInsert([5, 4, 3, 2, 1]);
    expect(inorder(root)).toEqual([1, 2, 3, 4, 5]);
    let current = root;
    let depth = 0;
    while (current) {
      expect(current.right).toBeNull();
      current = current.left;
      depth++;
    }
    expect(depth).toBe(5);
  });

  it("handles 200 random inputs with BST property", () => {
    for (let trial = 0; trial < 200; trial++) {
      const len = Math.floor(Math.random() * 20) + 1;
      const values = Array.from({ length: len }, () =>
        Math.floor(Math.random() * 200) - 100,
      );
      const root = bstInsert(values);
      const result = inorder(root);
      const expected = [...values].sort((a, b) => a - b);
      expect(result).toEqual(expected);
    }
  });
});

// ── bstInsertSteps ─────────────────────────────────────────────

describe("bstInsertSteps", () => {
  it("starts with phase 'idle'", () => {
    const steps = bstInsertSteps([50, 30, 70]);
    expect(steps[0].phase).toBe("idle");
  });

  it("ends with phase 'done'", () => {
    const steps = bstInsertSteps([50, 30, 70]);
    expect(steps[steps.length - 1].phase).toBe("done");
  });

  it("final tree matches bstInsert result (inorder)", () => {
    const input = [50, 30, 70, 20, 40, 60, 80];
    const steps = bstInsertSteps(input);
    const finalRoot = steps[steps.length - 1].root;
    expect(inorder(finalRoot)).toEqual(inorder(bstInsert(input)));
  });

  it("final tree has correct node count", () => {
    const input = [50, 30, 70, 20, 40];
    const steps = bstInsertSteps(input);
    const finalRoot = steps[steps.length - 1].root;
    expect(treeSize(finalRoot)).toBe(input.length);
  });

  it("every step title and detail are non-empty strings", () => {
    const steps = bstInsertSteps([50, 30, 70]);
    for (const step of steps) {
      expect(step.title).toBeTruthy();
      expect(step.detail).toBeTruthy();
      expect(typeof step.title).toBe("string");
      expect(typeof step.detail).toBe("string");
    }
  });

  it("node ids are stable across steps", () => {
    const steps = bstInsertSteps([50, 30, 70, 20]);

    // Collect all node ids that appear in any step
    const allIds = new Set<string>();
    for (const step of steps) {
      if (step.root) {
        for (const id of collectIds(step.root)) {
          allIds.add(id);
        }
      }
    }

    // Once a node appears, its id should remain in subsequent steps
    for (const id of allIds) {
      let appeared = false;
      for (const step of steps) {
        const currentIds = step.root ? new Set(collectIds(step.root)) : new Set();
        if (currentIds.has(id)) {
          appeared = true;
        }
        if (appeared && step.root) {
          expect(currentIds.has(id)).toBe(true);
        }
      }
    }
  });

  it("has insert steps for each value", () => {
    const input = [50, 30, 70];
    const steps = bstInsertSteps(input);
    const insertSteps = steps.filter((s) => s.phase === "insert");
    expect(insertSteps.length).toBe(input.length);
  });

  it("handles single element input", () => {
    const steps = bstInsertSteps([42]);
    expect(steps[steps.length - 1].phase).toBe("done");
    expect(treeSize(steps[steps.length - 1].root)).toBe(1);
  });

  it("handles empty input", () => {
    const steps = bstInsertSteps([]);
    expect(steps[steps.length - 1].phase).toBe("done");
    expect(steps[steps.length - 1].root).toBeNull();
  });
});
